<script setup lang="ts">
/**
 * Authentication.
 *
 * Frontend: the page's sample is React (`<CopilotKit headers={{ Authorization:
 * `Bearer ${userToken}` }} useSingleEndpoint={false}>`). The Vue provider takes
 * the same `headers` and `use-single-endpoint` props.
 *
 * Backend: /api/copilotkit-section-f-auth runs the page's `onRequest` Bearer
 * check and its `onBeforeHandler` thread-ownership check. The tokens below are
 * the runtime's two demo users (NOT DOC CODE stand-ins for real JWTs).
 *
 * All token modes share one `thread-id`, so after Alice has chatted, switching
 * to Bob addresses Alice's thread and the ownership check answers 403.
 */
import { computed, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RawEvents from "../backend/RawEvents.vue";

const TOKENS = {
  alice: { label: "Alice", token: "alice-token" },
  bob: { label: "Bob", token: "bob-token" },
  wrong: { label: "Invalid token", token: "not-a-real-token" },
  none: { label: "No token", token: "" },
} as const;
type Who = keyof typeof TOKENS;
const who = ref<Who>("alice");
const agentId = ref<"default" | "header-echo">("default");
const threadId = ref(crypto.randomUUID());
const newThread = () => (threadId.value = crypto.randomUUID());

const headers = computed<Record<string, string>>(() => {
  const userToken = TOKENS[who.value].token;
  const h: Record<string, string> = {};
  if (userToken) h.Authorization = `Bearer ${userToken}`;
  return h;
});

/** Direct calls with the current token, to show the hook answers verbatim. */
const probe = ref<{ label: string; status: number | string; body: string } | null>(null);
async function call(label: string, url: string) {
  try {
    const res = await fetch(url, { headers: headers.value });
    probe.value = { label, status: res.status, body: (await res.text()).slice(0, 1500) };
  } catch (error) {
    probe.value = { label, status: "network error", body: String(error) };
  }
}
</script>

<template>
  <DemoFrame parent-path="/auth" subtitle="headers → onRequest (401) → onBeforeHandler (403) · /api/copilotkit-section-f-auth">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <span class="text-slate-500">Signed in as:</span>
        <button
          v-for="(t, k) in TOKENS"
          :key="k"
          :data-testid="`token-${k}`"
          :class="['rounded-md px-2 py-1', who === k ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700']"
          @click="who = k"
        >
          {{ t.label }}
        </button>
        <code class="text-slate-500" data-testid="auth-headers">{{ JSON.stringify(headers) }}</code>
        <span class="ml-2 text-slate-500">agent:</span>
        <select v-model="agentId" data-testid="auth-agent" class="rounded border border-slate-300 bg-transparent px-1 py-0.5 dark:border-slate-700">
          <option value="default">default (Claude agent)</option>
          <option value="header-echo">header-echo (shows forwarded Authorization)</option>
        </select>
        <span>thread <code>{{ threadId.slice(0, 8) }}…</code></span>
        <button class="rounded-md border border-slate-300 px-2 py-1 dark:border-slate-700" data-testid="new-thread" @click="newThread">New thread</button>
      </div>
      <div class="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_24rem]">
        <div class="min-h-0">
          <!-- [!code highlight:6] -->
          <CopilotKitProvider
            :key="`${who}-${agentId}`"
            runtime-url="/api/copilotkit-section-f-auth"
            :headers="headers"
            :use-single-endpoint="false"
            :enable-inspector="INSPECTOR_ENABLED"
          >
            <div class="grid h-full grid-rows-[1fr_14rem]">
              <div class="min-h-0"><CopilotChat :agent-id="agentId" :thread-id="threadId" /></div>
              <div class="min-h-0 border-t border-slate-200 dark:border-slate-800"><RawEvents :agent-id="agentId" /></div>
            </div>
          </CopilotKitProvider>
        </div>
        <aside class="min-h-0 space-y-2 overflow-y-auto border-l border-slate-200 p-3 text-xs dark:border-slate-800">
          <p class="font-semibold uppercase tracking-wide text-slate-500">Direct calls with this token</p>
          <div class="flex flex-wrap gap-1">
            <button class="rounded-md border border-slate-300 px-2 py-0.5 dark:border-slate-700" data-testid="probe-info" @click="call('GET /info', '/api/copilotkit-section-f-auth/info')">GET /info</button>
            <button
              class="rounded-md border border-slate-300 px-2 py-0.5 dark:border-slate-700"
              data-testid="probe-messages"
              @click="call('GET /threads/:id/messages', `/api/copilotkit-section-f-auth/threads/${threadId}/messages`)"
            >
              GET /threads/:id/messages
            </button>
          </div>
          <div v-if="probe">
            <p>{{ probe.label }} → HTTP <strong data-testid="probe-status">{{ probe.status }}</strong></p>
            <pre class="mt-1 max-h-96 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-200" data-testid="probe-body">{{ probe.body }}</pre>
          </div>
        </aside>
      </div>
    </div>
  </DemoFrame>
</template>
