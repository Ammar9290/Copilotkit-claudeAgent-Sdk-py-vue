<script setup lang="ts">
/**
 * Fixed Schema A2UI.
 *
 * Backend: the page's `display_flight` tool returns an `a2ui_operations`
 * container (createSurface with catalogId "copilotkit://flight-fixed-catalog",
 * updateComponents with the pre-authored flight schema, updateDataModel).
 * Runtime: `a2ui: { injectA2UITool: false, agents: ["a2ui-fixed-schema"] }`.
 *
 * Frontend: the page builds its catalog with
 * `createCatalog(definitions, renderers, { catalogId, includeBasicCatalog })`
 * from `@copilotkit/a2ui-renderer`, which is a React package. `@copilotkit/vue`
 * 1.87.0 has no `createCatalog`, and its `createVueComponent` adapter is not
 * exported from the package entry (only `vueBasicCatalog` is). So the only
 * catalog a Vue app can pass through the documented `a2ui` prop is
 * `vueBasicCatalog`, and that is what this demo passes. No catalog is
 * hand-assembled from `@a2ui/web_core` internals; whatever the renderer does
 * with the page's catalog id is left as it is.
 */
import { CopilotChat, CopilotKitProvider, vueBasicCatalog } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/a2ui/fixed-schema" subtitle="agent: a2ui-fixed-schema · display_flight · vueBasicCatalog">
    <!-- [!code highlight:5] -->
    <CopilotKitProvider
      runtime-url="/api/copilotkit-section-c-a2ui-fixed"
      :a2ui="{ catalog: vueBasicCatalog }"
      :enable-inspector="INSPECTOR_ENABLED"
    >
      <div style="height: 100%">
        <CopilotChat agent-id="a2ui-fixed-schema" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
