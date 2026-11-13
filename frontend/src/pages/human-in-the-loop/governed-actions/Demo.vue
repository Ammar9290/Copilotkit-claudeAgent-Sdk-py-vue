<script setup lang="ts">
/**
 * "Provider setup": the page's `src/App.vue` — both registration components
 * and `<CopilotChat />` under the provider.
 *
 * The page relies on the default agent; this harness names one agent per
 * route, so the tree is wrapped in `CopilotChatConfigurationProvider agent-id`
 * (NOT DOC CODE). `useInterrupt` and `CopilotChat` both resolve that id.
 */
import { CopilotChat, CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import GovernedActionApproval from "./GovernedActionApproval.vue";
import GovernedActionTool from "./GovernedActionTool.vue";
</script>

<template>
  <DemoFrame parent-path="/human-in-the-loop/governed-actions" subtitle="agent: human-in-the-loop-governed-actions">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <CopilotChatConfigurationProvider agent-id="human-in-the-loop-governed-actions">
        <div class="flex h-full flex-col">
          <!-- [!code highlight:3] -->
          <GovernedActionApproval />
          <GovernedActionTool />
          <div class="min-h-0 flex-1"><CopilotChat /></div>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
