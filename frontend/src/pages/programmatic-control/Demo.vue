<script setup lang="ts">
/** The page's `src/App.vue`: a provider and `AgentTrigger`, with no chat UI. */
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import AgentTrigger from "./AgentTrigger.vue";
</script>

<template>
  <DemoFrame parent-path="/programmatic-control" subtitle="agent: programmatic-control · no composer">
    <!-- [!code highlight:3] -->
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <AgentTrigger />
    </CopilotKitProvider>
  </DemoFrame>
</template>
