<script setup lang="ts">
/** `src/components/ProductGrid.vue` from the Catalogs page (Vue tab), verbatim. */
defineProps<{ title?: string }>();
</script>

<template>
  <section>
    <h3 v-if="title" class="mb-2 font-semibold">{{ title }}</h3>
    <div class="grid grid-cols-2 gap-4">
      <slot name="children" />
    </div>
  </section>
</template>
