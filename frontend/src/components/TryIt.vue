<script setup lang="ts">
import { md } from "@/lib/md";

/** The concrete thing a tester should type, and what should happen. */
defineProps<{ prompts: string[]; expect: string; fail?: string }>();
</script>

<template>
  <div class="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Try it</p>
    <ul class="mt-2 space-y-1.5">
      <li v-for="p in prompts" :key="p">
        <code class="rounded bg-white px-2 py-1 text-xs text-slate-800 shadow-sm dark:bg-slate-950 dark:text-slate-200">{{ p }}</code>
      </li>
    </ul>
    <dl class="prose-notes mt-3 space-y-1 text-sm">
      <div class="flex gap-2">
        <dt class="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">Pass:</dt>
        <dd class="text-slate-700 dark:text-slate-300" v-html="md(expect)" />
      </div>
      <div v-if="fail" class="flex gap-2">
        <dt class="shrink-0 font-semibold text-rose-700 dark:text-rose-400">Fail:</dt>
        <dd class="text-slate-700 dark:text-slate-300" v-html="md(fail)" />
      </div>
    </dl>
  </div>
</template>
