<script setup lang="ts">
/** `src/components/WeatherToolCard.vue` from Tool Call Rendering, verbatim plus styling. */
defineProps<{
  parameters: { city?: string };
  status: "inProgress" | "executing" | "complete";
  result?: string;
}>();
</script>

<template>
  <div class="my-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm dark:border-sky-900 dark:bg-sky-950/40" data-testid="weather-tool-card">
    <p v-if="status !== 'complete'">Checking {{ parameters.city ?? "…" }}</p>
    <article v-else>
      <strong>{{ parameters.city }}</strong>
      <pre class="mt-1 whitespace-pre-wrap text-xs">{{ result }}</pre>
    </article>
  </div>
</template>
