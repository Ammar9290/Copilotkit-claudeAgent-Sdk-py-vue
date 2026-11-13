<script setup lang="ts">
/**
 * AgentRunner and persistence.
 *
 * Two runtimes, one per runner from the page:
 *   - in-memory: `MyRunner extends InMemoryAgentRunner` with the page's bounds
 *     and `onConcurrentRun: "supersede"` (/api/copilotkit-section-f-runner);
 *   - SQLite: `SqliteAgentRunner({ dbPath })` (/api/copilotkit-section-f-sqlite).
 *
 * The chat is pinned to an explicit `thread-id`. "Remount" destroys and
 * recreates the provider with the same id, so any history that reappears was
 * replayed by the runner's `connect`, not kept by the browser. The right-hand
 * panel reads the runner's store over HTTP (`/threads/:id/messages`) and the
 * MyRunner call log, so each `run` / `connect` the runtime made is visible.
 */
import { onMounted, onUnmounted, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";

const RUNNERS = {
  memory: { label: "InMemoryAgentRunner (MyRunner)", path: "/api/copilotkit-section-f-runner" },
  sqlite: { label: "SqliteAgentRunner", path: "/api/copilotkit-section-f-sqlite" },
} as const;
const runner = ref<keyof typeof RUNNERS>("memory");

const threadId = ref(crypto.randomUUID());
const mount = ref(0);

function newThread() {
  threadId.value = crypto.randomUUID();
  mount.value++;
}

const store = ref<{ status: number | string; body: string } | null>(null);
async function readStore() {
  try {
    const res = await fetch(`${RUNNERS[runner.value].path}/threads/${threadId.value}/messages`);
    const text = await res.text();
    let body = text;
    try {
      body = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* not JSON */
    }
    store.value = { status: res.status, body };
  } catch (error) {
    store.value = { status: "network error", body: String(error) };
  }
}

const calls = ref<{ at: string; method: string; threadId: string; detail: string }[]>([]);
async function readLog() {
  try {
    const res = await fetch(`${RUNNERS.memory.path}/__runner-log`);
    calls.value = ((await res.json()) as { calls: typeof calls.value }).calls.slice(-30).reverse();
  } catch {
    /* runtime down: leave the last log */
  }
}
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void readLog();
  timer = setInterval(readLog, 2000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <DemoFrame parent-path="/backend/agent-runner" :subtitle="`${RUNNERS[runner].label} · ${RUNNERS[runner].path}`">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <button
          v-for="(r, key) in RUNNERS"
          :key="key"
          :data-testid="`runner-${key}`"
          :class="['rounded-md px-2 py-1', runner === key ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700']"
          @click="runner = key; mount++; store = null"
        >
          {{ r.label }}
        </button>
        <span class="ml-2">threadId <code data-testid="thread-id">{{ threadId.slice(0, 8) }}…</code></span>
        <span>mount #<span data-testid="mount-count">{{ mount }}</span></span>
        <button class="rounded-md bg-[var(--accent)] px-2 py-1 text-white" data-testid="remount" @click="mount++">Remount chat (same threadId)</button>
        <button class="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700" data-testid="new-thread" @click="newThread">New thread</button>
      </div>
      <div class="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_24rem]">
        <div class="min-h-0">
          <!-- [!code highlight:3] -->
          <CopilotKitProvider :key="`${runner}-${mount}`" :runtime-url="RUNNERS[runner].path" :enable-inspector="INSPECTOR_ENABLED">
            <CopilotChat :thread-id="threadId" />
          </CopilotKitProvider>
        </div>
        <aside class="flex min-h-0 flex-col gap-3 overflow-y-auto border-l border-slate-200 p-3 text-xs dark:border-slate-800">
          <div>
            <div class="flex items-center justify-between">
              <p class="font-semibold uppercase tracking-wide text-slate-500">Runner store</p>
              <button class="rounded-md border border-slate-300 px-2 py-0.5 dark:border-slate-700" data-testid="read-store" @click="readStore">
                GET /threads/:id/messages
              </button>
            </div>
            <div v-if="store" class="mt-2">
              <p>HTTP <strong data-testid="store-status">{{ store.status }}</strong></p>
              <pre class="mt-1 max-h-72 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-200" data-testid="store-body">{{ store.body }}</pre>
            </div>
          </div>
          <div class="min-h-0">
            <p class="font-semibold uppercase tracking-wide text-slate-500">MyRunner calls (in-memory runtime)</p>
            <ol class="mt-1 font-mono text-[11px]" data-testid="runner-calls">
              <li v-for="(c, i) in calls" :key="i" :data-method="c.method" class="truncate border-b border-slate-100 py-0.5 dark:border-slate-800">
                <span class="text-slate-500">{{ c.at.slice(11, 19) }}</span>
                <span class="text-[var(--accent)]"> {{ c.method }}</span>
                <span> {{ c.threadId.slice(0, 8) }}</span>
                <span class="text-slate-500"> {{ c.detail }}</span>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  </DemoFrame>
</template>
