<script setup lang="ts">
/** The page's two `<script setup>` samples: publish cart state, handle `addToCart`. */
import { useGenerativeUIFunction, useGenerativeUIState } from "@copilotkit/vue/v2/generative-ui";
import { useCartStore } from "./cart-store";
import { shopUI } from "./shop-ui";

const cart = useCartStore();
// [!code highlight:5]
useGenerativeUIState(shopUI, "cart", () => ({ items: cart.items }));
useGenerativeUIFunction(shopUI, "addToCart", ({ productId, quantity }) => {
  cart.addItem(productId, quantity);
  return { added: productId };
});
</script>

<template><slot /></template>
