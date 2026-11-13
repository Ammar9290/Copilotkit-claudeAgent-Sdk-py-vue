<script setup lang="ts">
/**
 * `src/components/ProductCard.vue` from State and actions (Vue tab), verbatim,
 * plus the bound `inCart` prop from "Show live app state" and styling.
 */
import { ref } from "vue";
import type { GenerativeUIInvokeResult } from "@copilotkit/vue/v2/generative-ui";

const props = defineProps<{
  productId: string;
  name: string;
  inCart?: number;
  onAddToCart?: (args: { productId: string }) => Promise<GenerativeUIInvokeResult>;
}>();
const error = ref<string>();

async function add() {
  const result = await props.onAddToCart?.({ productId: props.productId });
  if (result && !result.ok) error.value = result.error.message;
}
</script>

<template>
  <article class="rounded-lg border border-slate-200 p-3 dark:border-slate-700" data-testid="product-card">
    <h4 class="font-medium">{{ name }}</h4>
    <p class="text-xs text-slate-500" data-testid="in-cart">in cart: {{ inCart ?? 0 }}</p>
    <button v-if="onAddToCart" class="mt-2 rounded-md bg-[var(--accent)] px-3 py-1 text-xs text-white" @click="add">
      Add to cart
    </button>
    <p v-if="error" role="alert" class="text-xs text-rose-600">{{ error }}</p>
  </article>
</template>
