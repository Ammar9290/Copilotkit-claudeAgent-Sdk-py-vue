<script setup lang="ts">
/**
 * `src/components/DashboardAgent.vue` from Frontend Tools — the
 * `useFrontendTool` call is verbatim. The incident list it filters is ours;
 * the page shows only "Current filter: {{ severity }}".
 */
import { computed, ref } from "vue";
import { z } from "zod";
import { CopilotChat, useFrontendTool } from "@copilotkit/vue/v2";

const severity = ref("all");

// [!code highlight:15]
useFrontendTool(
  {
    name: "filter_incidents",
    description: "Filter the visible incident list by severity.",
    parameters: z.object({
      severity: z.enum(["all", "sev1", "sev2", "sev3"]),
    }),
    handler: async ({ severity: nextSeverity }) => {
      severity.value = nextSeverity;
      return { applied: true, severity: nextSeverity };
    },
  },
  [severity],
);

const INCIDENTS = [
  { id: "INC-101", title: "Checkout API 5xx spike", sev: "sev1" },
  { id: "INC-102", title: "Search latency above SLO", sev: "sev2" },
  { id: "INC-103", title: "Stale avatar cache", sev: "sev3" },
  { id: "INC-104", title: "Login provider outage", sev: "sev1" },
  { id: "INC-105", title: "Email digest delayed", sev: "sev3" },
];
const visible = computed(() => INCIDENTS.filter((i) => severity.value === "all" || i.sev === severity.value));
</script>

<template>
  <div class="grid h-full grid-cols-1 md:grid-cols-[22rem_1fr]">
    <section class="min-h-0 overflow-y-auto border-r border-slate-200 p-4 dark:border-slate-800">
      <p class="text-sm">Current filter: <strong data-testid="current-filter">{{ severity }}</strong></p>
      <ul class="mt-3 space-y-2" data-testid="incident-list">
        <li v-for="i in visible" :key="i.id" class="rounded-md border border-slate-200 p-2 text-sm dark:border-slate-700">
          <span class="mr-2 rounded bg-slate-900 px-1.5 font-mono text-[10px] uppercase text-white dark:bg-slate-100 dark:text-slate-900">{{ i.sev }}</span>
          {{ i.title }}
        </li>
      </ul>
    </section>
    <div class="min-h-0"><CopilotChat agent-id="frontend-tools" /></div>
  </div>
</template>
