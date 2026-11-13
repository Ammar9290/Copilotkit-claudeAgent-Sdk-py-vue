<script setup lang="ts">
/**
 * `src/components/AgentTrigger.vue` from the Programmatic Control page (only
 * the agent id differs), plus:
 *   - the page's "Subscribing to agent events" `watch`, with each callback also
 *     written to an on-screen log, and
 *   - a read-only view of `agent.messages`, so the result of a run is visible
 *     without any chat UI.
 */
import { computed, ref, toRaw, watch } from "vue";
import { useAgent, useCopilotKit } from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "programmatic-control" });
const { copilotkit } = useCopilotKit();

async function run() {
  const current = agent.value;
  if (!current || current.isRunning) return;

  current.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content: "Summarize the latest sales data",
  });

  try {
    await copilotkit.value.runAgent({ agent: toRaw(current) });
  } catch (error) {
    console.error("CopilotKit runAgent failed:", error);
  }
}

function stop() {
  const current = agent.value;
  if (!current) return;
  copilotkit.value.stopAgent({ agent: toRaw(current) });
}

// "Subscribing to agent events": the page's watch, mirrored on screen.
const log = ref<string[]>([]);
const note = (line: string) => {
  console.log(line);
  log.value = [...log.value, `${new Date().toLocaleTimeString()}  ${line}`];
};

watch(
  agent,
  (current, _previous, onCleanup) => {
    if (!current) return;
    const subscription = current.subscribe({
      onRunStartedEvent: () => note("started"),
      onRunFinalized: () => note("done"),
      onRunFailed: ({ error }) => note(`failed: ${String(error)}`),
    });
    onCleanup(() => subscription.unsubscribe());
  },
  { immediate: true },
);

const messages = computed(() => agent.value?.messages ?? []);
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-6">
    <div class="flex gap-2">
      <!-- [!code highlight:2] -->
      <button
        :disabled="agent?.isRunning"
        data-testid="run-agent"
        class="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        @click="run"
      >
        Run agent
      </button>
      <button
        :disabled="!agent?.isRunning"
        data-testid="stop-agent"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-700"
        @click="stop"
      >
        Stop
      </button>
    </div>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[16rem_1fr]">
      <section class="min-h-0 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-800">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">agent.subscribe log</p>
        <ol class="mt-2 space-y-1 font-mono text-xs" data-testid="event-log">
          <li v-for="(l, i) in log" :key="i">{{ l }}</li>
        </ol>
      </section>
      <section class="min-h-0 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-800">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">agent.messages</p>
        <p v-if="messages.length === 0" class="mt-2 text-sm text-slate-400">No messages yet. There is no composer; press Run agent.</p>
        <article
          v-for="m in messages"
          :key="m.id"
          :data-role="m.role"
          class="programmatic-message mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800"
        >
          <span class="font-mono text-xs text-slate-500">{{ m.role }}:</span> {{ m.content }}
        </article>
      </section>
    </div>
  </div>
</template>
