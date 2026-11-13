<script setup lang="ts">
/** `src/components/WeatherCard.vue` from Components as Tools, verbatim plus styling. */
defineProps<{ city: string; temperature: number; condition: string }>();
</script>

<template>
  <article class="my-2 inline-block rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 dark:border-amber-900 dark:from-amber-950/40 dark:to-slate-900" data-testid="weather-card">
    <strong class="text-lg">{{ city }}</strong>
    <p class="text-sm text-slate-600 dark:text-slate-300">{{ temperature }}° · {{ condition }}</p>
  </article>
</template>
