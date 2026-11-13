<script setup lang="ts">
defineProps<{ title?: string; description?: string }>();
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <header
      v-if="title || $slots.actions"
      class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3 dark:border-slate-800"
    >
      <div>
        <h2 v-if="title" class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h2>
        <p v-if="description" class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ description }}</p>
      </div>
      <slot name="actions" />
    </header>
    <div class="p-5"><slot /></div>
  </section>
</template>
