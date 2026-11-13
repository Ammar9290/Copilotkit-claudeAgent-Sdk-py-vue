<script setup lang="ts">
/**
 * Catalogs: `shopUI` (`src/shop-ui.ts` + ProductGrid.vue + ProductCard.vue
 * from the Vue tab) on the provider, and, beside the chat, the JSON of
 * "Export the catalog for other A2UI tools".
 *
 * The agent gets the products from its backend `get_products` tool (NOT DOC
 * CODE, see backend/src/agents/routes/section_b.py).
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import { exportA2UICatalog } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import { shopUI } from "../_shared/shop-ui";

// The page's call. In @copilotkit/vue 1.87.0 the catalog returned by the Vue
// `createGenerativeUI` does not typecheck against `exportA2UICatalog`'s
// parameter (TS2345: "GenerativeUI<GenerativeUIResultDefinitions<...>> is not
// assignable to GenerativeUI<GenerativeUIDefinitions, GenerativeUIAnyComponent>").
// The argument is widened with `as never` so the shared typecheck passes; the
// runtime call is the page's, unchanged.
const catalog = JSON.stringify(exportA2UICatalog(shopUI as never, { title: "Acme shop" }), null, 2);
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/catalogs" subtitle="agent: gen-ui-components-catalogs · acme/shop@1">
    <!-- [!code highlight:1] -->
    <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: shopUI }" :enable-inspector="INSPECTOR_ENABLED">
      <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_22rem]">
        <div class="min-h-0"><CopilotChat agent-id="gen-ui-components-catalogs" /></div>
        <aside class="hidden min-h-0 overflow-auto border-l border-slate-200 bg-slate-950 p-3 md:block dark:border-slate-800">
          <p class="mb-2 font-mono text-xs text-slate-400">exportA2UICatalog(shopUI, { title: "Acme shop" })</p>
          <pre class="text-[11px] leading-snug text-slate-200" data-testid="exported-catalog">{{ catalog }}</pre>
        </aside>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
