<script setup lang="ts">
/** The page's `src/App.vue`. */
import { CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import DashboardAgent from "./DashboardAgent.vue";
</script>

<template>
  <DemoFrame parent-path="/frontend-tools" subtitle="agent: frontend-tools · useFrontendTool filter_incidents">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED"><DashboardAgent /></CopilotKitProvider>
  </DemoFrame>
</template>
