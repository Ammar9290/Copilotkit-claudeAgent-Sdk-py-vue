<script setup lang="ts">
/**
 * `src/components/StreamingDocument.vue` from State Streaming. The script is
 * the page's, unchanged (agent id `writer` included). Added: styling,
 * `data-testid`s, a snapshot counter (how many times `document` changed during
 * the run, which is what "streaming" means here) and a raw state dump.
 */
import { computed, ref, watch } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type DocumentState = { document?: string };

// [!code highlight:10]
const { agent } = useAgent({
  agentId: "writer",
  updates: [
    UseAgentUpdate.OnStateChanged,
    UseAgentUpdate.OnRunStatusChanged,
  ],
});
const state = computed(
  () => (agent.value?.state ?? {}) as DocumentState,
);

// Repo-authored instrumentation: count distinct `document` values per run.
const updates = ref(0);
watch(
  () => state.value.document,
  (next, prev) => {
    if (next && next !== prev) updates.value += 1;
  },
);
watch(
  () => agent.value?.isRunning,
  (running) => {
    if (running) updates.value = 0;
  },
);
</script>

<template>
  <!-- [!code highlight:4] -->
  <article aria-live="polite" class="space-y-3 p-6" data-testid="streaming-document">
    <span v-if="agent?.isRunning" class="inline-block rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white" data-testid="live-badge">LIVE</span>
    <p class="max-w-2xl whitespace-pre-wrap text-sm" data-testid="document-text">{{ state.document ?? "Waiting for a draft…" }}</p>
  </article>
  <p class="px-6 text-xs text-slate-500">
    document updates this run: <code data-testid="document-updates">{{ updates }}</code>
  </p>
  <details class="px-6 text-xs text-slate-500">
    <summary class="cursor-pointer">agent.state (raw)</summary>
    <pre class="mt-1 max-h-64 overflow-auto whitespace-pre-wrap" data-testid="state-dump">{{ JSON.stringify(agent?.state ?? {}, null, 2) }}</pre>
  </details>
</template>
