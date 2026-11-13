<script setup lang="ts">
/**
 * `src/components/ResearchProgress.vue` from State Rendering. The script is
 * the page's, unchanged (agent id `researcher` included). Added: styling,
 * `data-testid`s and a raw `agent.state` dump so you can see which keys
 * actually arrive. The page's component reads `status` / `draft` /
 * `completed` / `total`; the page's published backend only ever writes
 * `document` (see the notes).
 */
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type ResearchState = { status?: string; draft?: string; completed?: number; total?: number };

// [!code highlight:4]
const { agent } = useAgent({
  agentId: "researcher",
  updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
});

const state = computed(() => (agent.value?.state ?? {}) as ResearchState);
</script>

<template>
  <!-- [!code highlight:5] -->
  <section aria-live="polite" class="space-y-3 p-6" data-testid="research-progress">
    <p class="text-lg font-semibold" data-testid="research-status">{{ state.status ?? "Idle" }}</p>
    <progress :value="state.completed ?? 0" :max="state.total ?? 1" class="w-full max-w-md" data-testid="research-progress-bar" />
    <article v-if="state.draft" class="max-w-xl whitespace-pre-wrap rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700" data-testid="research-draft">{{ state.draft }}</article>
  </section>
  <details class="px-6 text-xs text-slate-500" open>
    <summary class="cursor-pointer">agent.state (raw) · running: <span data-testid="agent-running">{{ agent?.isRunning ? "yes" : "no" }}</span></summary>
    <pre class="mt-1 max-h-64 overflow-auto whitespace-pre-wrap" data-testid="state-dump">{{ JSON.stringify(agent?.state ?? {}, null, 2) }}</pre>
  </details>
</template>
