<script setup lang="ts">
/** `src/components/ProductCard.vue` from the Catalogs page (Vue tab), plus Tailwind classes and a data-testid. */
defineProps<{ name: string; price: number; imageUrl: string }>();
</script>

<template>
  <article class="product-card rounded-lg border border-slate-200 p-2 dark:border-slate-700" data-testid="product-card">
    <img :src="imageUrl" :alt="name" class="h-24 w-full rounded object-cover" />
    <h4 class="mt-1 text-sm font-medium">{{ name }}</h4>
    <p class="text-sm text-slate-600 dark:text-slate-400">{{ "$" + price }}</p>
  </article>
</template>
