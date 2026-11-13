<script setup lang="ts">
/**
 * `src/components/SharedWorkspace.vue` from Shared State: the "Reading agent
 * state" and "Writing agent state" halves of the same file, merged. Doc code is
 * unchanged (agent id `workspace` included); only markup styling, a second tone
 * button and a state dump were added.
 */
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

type WorkspaceState = {
  notes?: string[];
  preferences?: { tone?: string };
};

// [!code highlight:4]
const { agent } = useAgent({
  agentId: "workspace",
  updates: [UseAgentUpdate.OnStateChanged],
});
const state = computed(
  () => (agent.value?.state ?? {}) as WorkspaceState,
);

// [!code highlight:10]
function setTone(tone: string) {
  const current = agent.value;
  if (!current) return;

  const previous = (current.state ?? {}) as WorkspaceState;
  current.setState({
    ...previous,
    preferences: { ...previous.preferences, tone },
  });
}
</script>

<template>
  <section class="space-y-5 p-5">
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes · written by the agent</h3>
      <ul class="mt-2 space-y-1" data-testid="notes-list">
        <li
          v-for="note in state.notes ?? []"
          :key="note"
          class="rounded-md bg-amber-50 px-3 py-1.5 text-sm dark:bg-amber-950/40"
          data-testid="note"
        >
          {{ note }}
        </li>
      </ul>
      <p v-if="!(state.notes ?? []).length" class="mt-2 text-xs text-slate-500">
        Empty. Ask the agent to remember something.
      </p>
    </div>
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferences · written by the UI</h3>
      <div class="mt-2 flex flex-wrap gap-2">
        <button
          class="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          data-testid="tone-concise"
          @click="setTone('concise')"
        >
          Prefer concise answers
        </button>
        <button
          class="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
          data-testid="tone-playful"
          @click="setTone('playful')"
        >
          Prefer playful answers
        </button>
      </div>
      <p class="mt-2 text-xs text-slate-500">
        tone: <code data-testid="tone">{{ state.preferences?.tone ?? "(unset)" }}</code>
      </p>
    </div>
    <details class="text-xs text-slate-500" open>
      <summary class="cursor-pointer">agent.state</summary>
      <pre class="mt-1 whitespace-pre-wrap" data-testid="state-dump">{{ JSON.stringify(state, null, 2) }}</pre>
    </details>
  </section>
</template>
