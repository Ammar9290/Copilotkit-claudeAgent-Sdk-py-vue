<script setup lang="ts">
/** The "Airport" component the Adopt from A2UI page converts. NOT DOC CODE (markup): the page does not publish it. */
defineProps<{ code: string; city: string }>();
</script>

<template>
  <div class="inline-flex flex-col items-center rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700" data-testid="airport">
    <span class="text-2xl font-bold tracking-wider">{{ code }}</span>
    <span class="text-xs text-slate-500">{{ city }}</span>
  </div>
</template>
