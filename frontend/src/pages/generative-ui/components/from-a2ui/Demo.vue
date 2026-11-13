<script setup lang="ts">
/**
 * Adopt from A2UI — "Before and after", the Vue "After": `:generativeUI` with
 * the converted catalog, and nothing A2UI-specific on the runtime (the main
 * runtime's `a2ui` option is scoped to the fixed-schema agent only).
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import { appUI } from "./app-ui";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/from-a2ui" subtitle="agent: gen-ui-components-from-a2ui · acme/flights@1">
    <!-- [!code highlight:1] -->
    <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: appUI }" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat agent-id="gen-ui-components-from-a2ui" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
