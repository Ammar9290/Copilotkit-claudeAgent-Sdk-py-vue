<script setup lang="ts">
withDefaults(defineProps<{ tone?: "info" | "warn" | "premium" | "success"; title?: string }>(), { tone: "info" });

const TONES = {
  info: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  premium:
    "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
} as const;
</script>

<template>
  <div :class="`prose-notes rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`">
    <p v-if="title" class="font-semibold">{{ title }}</p>
    <div :class="title ? 'mt-1' : ''"><slot /></div>
  </div>
</template>
