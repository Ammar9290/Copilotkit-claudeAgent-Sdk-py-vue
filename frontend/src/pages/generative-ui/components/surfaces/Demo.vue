<script setup lang="ts">
/**
 * Surfaces: a shop home page whose "Featured Products" row is a page target
 * (`<GenerativeUISurface id="featured">`, FeaturedProducts.vue), a second,
 * per-item target from "One target for each item", the provider's error
 * boundary from "When a component fails" (onError + RetryFallback), and a
 * sidebar chat to ask from.
 *
 * The agent gets the products from its backend `get_products` tool (NOT DOC
 * CODE, see backend/src/agents/routes/section_b.py).
 */
import { computed, ref } from "vue";
import { CopilotKitProvider, CopilotSidebar } from "@copilotkit/vue/v2";
import { GenerativeUISurface, type GenerativeUIErrorInfo } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import { PRODUCTS } from "../_shared/products";
import { shopUI } from "../_shared/shop-ui";
import FeaturedProducts from "./FeaturedProducts.vue";
import RetryFallback from "./RetryFallback.vue";

function onError(info: GenerativeUIErrorInfo) {
  console.warn(info.kind, info.surfaceId, info.error.message);
}

// "One target for each item": the product currently open on the page.
const current = ref(PRODUCTS[0]!);
const description = computed(
  () =>
    `The "You might also like" row under ${current.value.name}. Show related products here. Never include ${current.value.name} itself.`,
);
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/surfaces" subtitle="agent: gen-ui-components-surfaces · page target #featured">
    <!-- [!code highlight:5] -->
    <CopilotKitProvider
      runtime-url="/api/copilotkit"
      :generativeUI="{ ui: shopUI, errorBoundary: { onError, fallback: RetryFallback } }"
      :enable-inspector="INSPECTOR_ENABLED"
    >
      <main class="h-full overflow-y-auto p-8 pr-[26rem]">
        <h2 class="text-2xl font-semibold">Acme Store</h2>
        <p class="mt-1 text-sm text-slate-500">Home page</p>
        <section class="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800" data-testid="featured-section">
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Featured Products</h3>
          <FeaturedProducts :products="PRODUCTS.slice(0, 2)" />
        </section>
        <section class="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-800" data-testid="recommendations-section">
          <div class="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold uppercase tracking-wide text-slate-500">Product page:</span>
            <button
              v-for="p in PRODUCTS"
              :key="p.productId"
              :class="['rounded-md px-2 py-0.5 text-xs', p.productId === current.productId ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700']"
              @click="current = p"
            >
              {{ p.name }}
            </button>
          </div>
          <p class="mb-2 text-xs text-slate-500">You might also like (target <code>recommendations-{{ current.productId }}</code>)</p>
          <GenerativeUISurface :id="`recommendations-${current.productId}`" :description="description">
            <p class="text-xs italic text-slate-400">Ask the chat for recommendations for this product.</p>
          </GenerativeUISurface>
        </section>
      </main>
      <CopilotSidebar agent-id="gen-ui-components-surfaces" :default-open="true" />
    </CopilotKitProvider>
  </DemoFrame>
</template>
