<script setup lang="ts">
/**
 * Agent Read-Only Context: the page's `src/App.vue` — `<WorkspaceContext />`
 * and `<CopilotChat />` under the provider. The chat is pointed at this route's
 * agent with `CopilotChatConfigurationProvider` (NOT DOC CODE) so the page's
 * `<CopilotChat />` stays as printed.
 */
import { CopilotChat, CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import WorkspaceContext from "./WorkspaceContext.vue";
</script>

<template>
  <DemoFrame parent-path="/shared-state/agent-readonly" subtitle="agent: shared-state-agent-readonly · useAgentContext">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <CopilotChatConfigurationProvider agent-id="shared-state-agent-readonly">
        <div class="flex h-full flex-col">
          <!-- [!code highlight:2] -->
          <WorkspaceContext />
          <div class="min-h-0 flex-1"><CopilotChat /></div>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
