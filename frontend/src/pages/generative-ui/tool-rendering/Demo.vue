<script setup lang="ts">
/** The page's `src/App.vue`: mount the registration component beneath the provider. */
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import AgentExperience from "./AgentExperience.vue";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/tool-rendering" subtitle="agent: generative-ui-tool-rendering · backend tool get_weather">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED"><AgentExperience /></CopilotKitProvider>
  </DemoFrame>
</template>
