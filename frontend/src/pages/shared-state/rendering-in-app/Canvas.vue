<script setup lang="ts">
/**
 * `src/components/Canvas.vue` from "Render agent state in your app". The
 * script is the page's, unchanged: `useAgent` with no `agentId`, so it resolves
 * the agent the surrounding `CopilotChatConfigurationProvider` names (see
 * Demo.vue). Added: the page's `toggleItem` from "Writing back from the main
 * view", wired to a click, plus styling.
 */
import { computed, watchEffect } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type CanvasState = {
  title: string;
  items: { id: string; label: string; done: boolean }[];
};

const initialState: CanvasState = {
  title: "Project launch",
  items: [
    { id: "research", label: "Research user needs", done: true },
    { id: "prototype", label: "Build a prototype", done: false },
  ],
};

// [!code highlight:3]
const { agent } = useAgent({
  updates: [UseAgentUpdate.OnStateChanged],
});
const state = computed(
  () => (agent.value?.state ?? {}) as Partial<CanvasState>,
);

watchEffect(() => {
  const currentAgent = agent.value;
  if (!currentAgent) return;

  const current = (currentAgent.state ?? {}) as Partial<CanvasState>;
  const updates: Partial<CanvasState> = {};
  if (current.title === undefined) updates.title = initialState.title;
  if (current.items === undefined) updates.items = initialState.items;

  if (Object.keys(updates).length > 0) {
    currentAgent.setState({ ...current, ...updates });
  }
});

// [!code highlight:12]
function toggleItem(id: string) {
  const currentAgent = agent.value;
  if (!currentAgent) return;

  const current = (currentAgent.state ?? {}) as Partial<CanvasState>;
  currentAgent.setState({
    ...current,
    items: (current.items ?? []).map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    ),
  });
}
</script>

<template>
  <main class="canvas h-full overflow-y-auto p-8">
    <p class="text-xs uppercase tracking-wide text-slate-400">Canvas · agent.state</p>
    <h1 class="mt-1 text-2xl font-semibold" data-testid="canvas-title">{{ state.title ?? "Untitled" }}</h1>
    <ul class="mt-4 max-w-xl space-y-2" data-testid="canvas-items">
      <li
        v-for="item in state.items ?? []"
        :key="item.id"
        :data-done="item.done"
        :data-id="item.id"
        class="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
        data-testid="canvas-item"
        @click="toggleItem(item.id)"
      >
        <span :class="item.done ? 'text-emerald-600' : 'text-slate-400'">{{ item.done ? "✔" : "○" }}</span>
        <span :class="item.done ? 'text-slate-500 line-through' : ''">{{ item.label }}</span>
      </li>
    </ul>
    <p class="mt-4 text-xs text-slate-500">Click an item to toggle it; the agent sees the change on its next turn.</p>
  </main>
</template>
