<script setup lang="ts">
/**
 * Components and surfaces — the Vue tab's `src/App.vue`: the standard catalog
 * on the provider and a plain chat. The chart and map plugins are registered
 * in `src/main.ts`, as the page's second `main.ts` shows.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import { standardUI } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components" subtitle="agent: gen-ui-components · standardUI">
    <!-- [!code highlight:4] -->
    <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: standardUI }" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat agent-id="gen-ui-components" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
