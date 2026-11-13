<script setup lang="ts">
/**
 * NOT DOC CODE. "Rendering a live delegation log" on the Sub-Agents page has a
 * heading and no snippet. This reads the `delegations` slot the page describes
 * ({ id, sub_agent, task, status: running|completed|failed, result }) with the
 * Shared State page's `useAgent` pattern.
 */
import { computed } from "vue";
import { useAgent, UseAgentUpdate } from "@copilotkit/vue/v2";

interface Delegation {
  id: string;
  sub_agent: string;
  task: string;
  status: "running" | "completed" | "failed";
  result: string;
}

const { agent } = useAgent({ agentId: "subagents", updates: [UseAgentUpdate.OnStateChanged] });
const delegations = computed(
  () => (agent.value?.state as { delegations?: Delegation[] } | undefined)?.delegations ?? [],
);

const LABEL: Record<string, string> = {
  research_agent: "Research",
  writing_agent: "Writing",
  critique_agent: "Critique",
};
</script>

<template>
  <section class="flex h-full flex-col" data-testid="delegation-log">
    <p class="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
      Delegation log ({{ delegations.length }})
    </p>
    <ol class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
      <li
        v-for="d in delegations"
        :key="d.id"
        class="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700"
        data-testid="delegation-entry"
        :data-status="d.status"
      >
        <div class="flex items-center justify-between">
          <strong>{{ LABEL[d.sub_agent] ?? d.sub_agent }}</strong>
          <span
            :class="d.status === 'completed' ? 'text-emerald-600' : d.status === 'failed' ? 'text-rose-600' : 'text-amber-600'"
          >{{ d.status }}</span>
        </div>
        <p class="mt-1 text-slate-500">{{ d.task }}</p>
        <p v-if="d.result" class="mt-1 line-clamp-4 whitespace-pre-wrap">{{ d.result }}</p>
      </li>
      <li v-if="!delegations.length" class="text-xs text-slate-500">No delegations yet.</li>
    </ol>
  </section>
</template>
