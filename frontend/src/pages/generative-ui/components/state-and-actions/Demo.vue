<script setup lang="ts">
/**
 * State and actions: the catalog (shop-ui.ts), its state and function
 * bindings (Bindings.vue), and a cart counter on the page that "Add to cart"
 * clicks change with no message to the agent.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import Bindings from "./Bindings.vue";
import { useCartStore } from "./cart-store";
import { shopUI } from "./shop-ui";

const cart = useCartStore();
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/state-and-actions" subtitle="agent: gen-ui-components-state-and-actions">
    <!-- [!code highlight:1] -->
    <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: shopUI }" :enable-inspector="INSPECTOR_ENABLED">
      <Bindings>
        <div class="flex h-full flex-col">
          <div class="flex items-center gap-3 border-b border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
            <span class="font-semibold">Cart</span>
            <span class="rounded-full bg-slate-900 px-2 text-xs text-white dark:bg-slate-100 dark:text-slate-900" data-testid="cart-count">{{ cart.count }}</span>
            <span class="truncate text-xs text-slate-500" data-testid="cart-items">{{ cart.items.map((i) => `${i.productId}×${i.quantity}`).join(", ") }}</span>
          </div>
          <div class="min-h-0 flex-1"><CopilotChat agent-id="gen-ui-components-state-and-actions" /></div>
        </div>
      </Bindings>
    </CopilotKitProvider>
  </DemoFrame>
</template>
