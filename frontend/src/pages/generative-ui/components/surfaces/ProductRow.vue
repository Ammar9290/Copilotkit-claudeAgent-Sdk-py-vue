<script setup lang="ts">
/** The default content of the "featured" surface before the agent draws into it. NOT DOC CODE: the page imports it without publishing it. */
import type { Product } from "../_shared/products";

defineProps<{ products: Product[] }>();
</script>

<template>
  <div class="flex gap-3 overflow-x-auto" data-testid="product-row">
    <div v-for="p in products" :key="p.productId" class="w-36 shrink-0 rounded-lg border border-dashed border-slate-300 p-2 text-xs text-slate-500 dark:border-slate-700">
      {{ p.name }}
    </div>
  </div>
</template>
