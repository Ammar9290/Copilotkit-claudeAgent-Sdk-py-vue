<script setup lang="ts">
import { STATUS_LABEL, type RouteStatus } from "@/lib/nav-config";

defineProps<{ status: RouteStatus }>();

const STYLES: Record<RouteStatus, string> = {
  working:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  partial:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  reference:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  broken: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  "not-started": "border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500",
  "not-available":
    "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
};
</script>

<template>
  <span
    :class="`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`"
  >
    {{ STATUS_LABEL[status] }}
  </span>
</template>
