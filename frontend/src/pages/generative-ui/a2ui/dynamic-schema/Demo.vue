<script setup lang="ts">
/**
 * Dynamic Schema A2UI, the page's default path: pass a catalog to the provider
 * and nothing else. The catalog auto-enables A2UI and injects `generate_a2ui`,
 * so the runtime is the plain shared `/api/copilotkit` one with no `a2ui`
 * block.
 *
 * The page's catalog (Card / StatusBadge / Metric / InfoRow / DataTable /
 * PrimaryButton / PieChart / BarChart) is built with React's `createCatalog`
 * from `@copilotkit/a2ui-renderer`; `@copilotkit/vue` 1.87.0 publishes no Vue
 * equivalent. The Vue provider's `a2ui` prop takes `vueBasicCatalog`, so the
 * LLM designs surfaces from the basic components only (Card, Column, Row,
 * Text, Button, TextField, CheckBox, ChoicePicker, Slider, …).
 */
import { CopilotChat, CopilotKitProvider, vueBasicCatalog } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/a2ui/dynamic-schema" subtitle="agent: a2ui-dynamic-schema · catalog on provider · /api/copilotkit">
    <!-- [!code highlight:5] -->
    <CopilotKitProvider
      runtime-url="/api/copilotkit"
      :a2ui="{ catalog: vueBasicCatalog }"
      :enable-inspector="INSPECTOR_ENABLED"
    >
      <div style="height: 100%">
        <CopilotChat agent-id="a2ui-dynamic-schema" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
