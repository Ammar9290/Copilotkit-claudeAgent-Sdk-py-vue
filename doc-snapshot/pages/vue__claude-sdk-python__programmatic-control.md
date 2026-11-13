# Programmatic Control

> Drive agent runs directly from code — no chat UI required.

## What is this?

Programmatic control is what you reach for when you want to drive an agent run from code rather than from a chat composer: a button, a form, a cron job, a keyboard shortcut, or a graph callback. CopilotKit exposes three primitives that cover every triggering pattern:

- `agent.addMessage(...)` — append a message to the conversation without running the agent. Pair it with `copilotkit.runAgent({ agent })` when the message should kick off a turn.
- `copilotkit.runAgent({ agent })` — the same entry point `<CopilotChat />` calls under the hood. It orchestrates frontend tools, follow-up runs, and the subscriber lifecycle.
- `agent.subscribe(subscriber)` — low-level AG-UI event subscription (`onCustomEvent`, `onRunStartedEvent`, `onRunFinalized`, `onRunFailed`, and streaming deltas).

## When should I use this?

Use programmatic control when you want to:

- Trigger agent runs from buttons, forms, or other UI elements
- Execute specific tools directly from UI interactions without an LLM turn
- Build agent features without a chat window
- Access agent state and results programmatically
- Create fully custom agent-driven workflows

## Sending a message from code

<Steps>
  <Step>
    ### Run Claude through an AG-UI endpoint

    Programmatic control starts from the same AG-UI run boundary as the chat UI.
    Wrap Claude Agent SDK once to expose that endpoint. The frontend patterns
    on this page then use the same agent connection, whether they trigger a
    run, render a headless chat, or resolve an interrupt.
  </Step>
</Steps>

The canonical pattern is to append a user message with `agent.addMessage`, then call `copilotkit.runAgent({ agent })`. Use `copilotkit.stopAgent({ agent })` to cancel an in-flight run.

```vue title="src/components/AgentTrigger.vue"
<script setup lang="ts">
import { toRaw } from "vue";
import { useAgent, useCopilotKit } from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "sales" });
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
</script>

<template>
  <button :disabled="agent?.isRunning" @click="run">Run agent</button>
  <button :disabled="!agent?.isRunning" @click="stop">Stop</button>
</template>
```

```vue title="src/App.vue"
<script setup lang="ts">
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import AgentTrigger from "./components/AgentTrigger.vue";
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <AgentTrigger />
  </CopilotKitProvider>
</template>
```

### `copilotkit.runAgent()` vs `agent.runAgent()`

Both methods trigger the agent, but they operate at different levels:

- **`copilotkit.runAgent({ agent })`** — the recommended default. It orchestrates the full lifecycle, executes frontend tools, handles follow-up runs, and routes errors through the subscriber system.
- **`agent.runAgent(options)`** — a low-level method on the agent instance. It sends the request to the runtime but does **not** execute frontend tools or chain follow-ups. Reach for it only when you need direct control.

## Subscribing to agent events

`agent.subscribe(subscriber)` returns `{ unsubscribe }`. The subscriber accepts every AG-UI lifecycle callback: `onCustomEvent`, `onRunStartedEvent`, `onRunFinalized`, `onRunFailed`, and the streaming deltas. Use it to drive progress UI, forward events to analytics, or inspect framework pause/resume events.

```ts
import { watch } from "vue";

watch(
  agent,
  (current, _previous, onCleanup) => {
    if (!current) return;
    const subscription = current.subscribe({
      onRunStartedEvent: () => console.log("started"),
      onRunFinalized: () => console.log("done"),
      onRunFailed: ({ error }) => console.error(error),
    });
    onCleanup(() => subscription.unsubscribe());
  },
  { immediate: true },
);
```





## Resolving a frontend tool call from a button

For promise-based integrations there is no native interrupt primitive. Register a `useHumanInTheLoop` frontend tool instead. Its handler remains pending, the rendered Vue component exposes the approval in any application surface, and calling `respond(...)` resolves the Promise the agent's tool call is awaiting.

The resulting pending state and response callback are pure data; the same pattern can power a modal, toast, sidebar form, or voice UI.





## See also

- [Headless UI](/vue/claude-sdk-python/vue/custom-look-and-feel/headless-ui) — build your own chat surface from lower-level components.
- [Human-in-the-Loop](./human-in-the-loop) — compare `useHumanInTheLoop` and `useInterrupt` for paused runs.

<IntegrationGrid path="programmatic-control" />
