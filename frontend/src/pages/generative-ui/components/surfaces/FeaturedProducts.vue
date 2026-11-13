<script setup lang="ts">
/** `src/components/FeaturedProducts.vue` from the Surfaces page (Vue tab), verbatim. */
import { GenerativeUISurface } from "@copilotkit/vue/v2/generative-ui";
import type { Product } from "../_shared/products";
import { shopUI } from "../_shared/shop-ui";
import ProductRow from "./ProductRow.vue";

defineProps<{ products: Product[] }>();
</script>

<template>
  <GenerativeUISurface
    id="featured"
    :ui="shopUI"
    description="The Featured Products row of the home page. When the customer asks to see products here, show them as a ProductGrid with one ProductCard for each product. When they ask for the featured products again, delete this surface."
    :components="['ProductGrid', 'ProductCard']"
  >
    <ProductRow :products="products" />
  </GenerativeUISurface>
</template>
