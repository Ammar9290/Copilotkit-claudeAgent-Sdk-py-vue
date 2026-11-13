<script setup lang="ts">
/**
 * Connect AG-UI agents — "Subscribing to AG-UI events", ported to Vue.
 *
 * The page's samples are React (`useAgent` + `useEffect` returning
 * `subscription.unsubscribe`). In Vue the same thing is a `watch` on the agent
 * ref with `onCleanup`. Every callback from the page's table is attached, and
 * each appends a row; the three the page's sample logs (`onTextMessageContentEvent`
 * with `textMessageBuffer`, `onToolCallEndEvent` with `toolCallName` /
 * `toolCallArgs`, `onStateChanged`) log the same fields it does.
 *
 * Above the log is the page's `AgentStatus`: `agent.messages`, `agent.state`,
 * `agent.isRunning` read straight off the resolved AbstractAgent.
 */
import { computed, ref, watch } from "vue";
import { useAgent } from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "section-f-ag-ui" });
const events = ref<{ name: string; detail: string }[]>([]);
const tick = ref(0); // re-read agent fields when anything changes

const push = (name: string, detail = "") => {
  events.value = [...events.value.slice(-299), { name, detail }];
  tick.value++;
};

// [!code highlight:30]
watch(
  agent,
  (current, _previous, onCleanup) => {
    if (!current) return;
    const subscription = current.subscribe({
      onRunStartedEvent: ({ event }) => push("onRunStartedEvent", event.runId),
      onRunFinishedEvent: () => push("onRunFinishedEvent"),
      onRunErrorEvent: ({ event }) => push("onRunErrorEvent", event.message),
      onStepStartedEvent: ({ event }) => push("onStepStartedEvent", event.stepName),
      onStepFinishedEvent: ({ event }) => push("onStepFinishedEvent", event.stepName),
      onTextMessageStartEvent: () => push("onTextMessageStartEvent"),
      onTextMessageContentEvent: ({ textMessageBuffer }) =>
        push("onTextMessageContentEvent", `Streaming text: ${JSON.stringify(textMessageBuffer)}`),
      onTextMessageEndEvent: () => push("onTextMessageEndEvent"),
      onToolCallStartEvent: ({ event }) => push("onToolCallStartEvent", event.toolCallName),
      onToolCallArgsEvent: ({ event }) => push("onToolCallArgsEvent", event.delta),
      onToolCallEndEvent: ({ toolCallName, toolCallArgs }) =>
        push("onToolCallEndEvent", `Tool called: ${toolCallName} ${JSON.stringify(toolCallArgs)}`),
      onToolCallResultEvent: ({ event }) => push("onToolCallResultEvent", String(event.content).slice(0, 120)),
      onStateSnapshotEvent: ({ event }) => push("onStateSnapshotEvent", JSON.stringify(event.snapshot)),
      onStateDeltaEvent: ({ event }) => push("onStateDeltaEvent", JSON.stringify(event.delta)),
      onMessagesSnapshotEvent: ({ event }) => push("onMessagesSnapshotEvent", `${event.messages.length} messages`),
      onCustomEvent: ({ event }) => push("onCustomEvent", event.name),
      onRawEvent: () => push("onRawEvent"),
      onMessagesChanged: ({ agent }) => push("onMessagesChanged", `${agent.messages.length} messages`),
      onStateChanged: ({ agent }) => push("onStateChanged", `State changed: ${JSON.stringify(agent.state)}`),
    });
    onCleanup(() => subscription.unsubscribe());
  },
  { immediate: true },
);

const status = computed(() => {
  void tick.value;
  const a = agent.value;
  return a ? { messages: a.messages.length, state: JSON.stringify(a.state), isRunning: a.isRunning } : null;
});
</script>

<template>
  <section class="flex h-full min-h-0 flex-col">
    <div class="border-b border-slate-200 px-3 py-2 text-xs dark:border-slate-800" data-testid="agent-status">
      <p class="font-semibold uppercase tracking-wide text-slate-500">AgentStatus</p>
      <p v-if="status" class="mt-1 font-mono">
        messages <strong data-testid="status-messages">{{ status.messages }}</strong> · isRunning
        <strong data-testid="status-running">{{ status.isRunning }}</strong> · state {{ status.state }}
      </p>
    </div>
    <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        agent.subscribe callbacks ({{ events.length }})
      </p>
      <button class="text-xs underline" @click="events = []">clear</button>
    </div>
    <ol class="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-[11px]" data-testid="agui-events">
      <li
        v-for="(e, i) in events"
        :key="i"
        :data-callback="e.name"
        class="truncate border-b border-slate-100 py-0.5 dark:border-slate-800"
      >
        <span class="text-[var(--accent)]">{{ e.name }}</span> <span class="text-slate-500">{{ e.detail }}</span>
      </li>
    </ol>
  </section>
</template>
