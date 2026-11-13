<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import Panel from "@/components/Panel.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { NAV, ALL_ROUTES, STATUS_LABEL, docUrl, type RouteStatus } from "@/lib/nav-config";

const counts = computed(() => {
  const c: Partial<Record<RouteStatus, number>> = {};
  for (const r of ALL_ROUTES) c[r.status] = (c[r.status] ?? 0) + 1;
  return c;
});
</script>

<template>
  <header class="border-b border-slate-200 pb-5 dark:border-slate-800">
    <h1 class="text-2xl font-semibold tracking-tight">Status overview</h1>
    <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
      Every doc page in scope, its route, and whether the implementation works. Mirrors the README's testing checklist.
    </p>
    <div class="mt-4 flex flex-wrap gap-2">
      <span v-for="(n, s) in counts" :key="s" class="text-xs text-slate-600 dark:text-slate-400">
        <StatusBadge :status="s as RouteStatus" /> × {{ n }}
      </span>
    </div>
  </header>

  <Panel v-for="group in NAV" :key="group.title" :title="group.title">
    <table class="w-full text-left text-sm">
      <thead class="text-xs uppercase tracking-wide text-slate-400">
        <tr>
          <th class="pb-2 pr-3 font-semibold">Doc page</th>
          <th class="pb-2 pr-3 font-semibold">Route</th>
          <th class="pb-2 pr-3 font-semibold">Status</th>
          <th class="pb-2 font-semibold">Notes</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <tr v-for="r in group.routes" :key="r.path" class="align-top">
          <td class="py-2 pr-3">
            <a :href="docUrl(r)" target="_blank" rel="noreferrer" class="text-[var(--accent)] underline underline-offset-2">{{ r.title }}</a>
          </td>
          <td class="py-2 pr-3">
            <RouterLink :to="r.path" class="font-mono text-xs text-slate-700 underline dark:text-slate-300">{{ r.path }}</RouterLink>
          </td>
          <td class="py-2 pr-3"><StatusBadge :status="r.status" /></td>
          <td class="py-2 text-xs text-slate-500">
            {{ r.statusNote ?? "" }}
            <span v-if="r.offNav" class="block">Not in the Vue doc sidebar.</span>
            <span v-if="r.reactOnlyDoc" class="block">Doc shows React code only — ported to the Vue API.</span>
          </td>
        </tr>
      </tbody>
    </table>
  </Panel>
  <p class="text-xs text-slate-400">Legend: {{ Object.values(STATUS_LABEL).join(" · ") }}</p>
</template>
