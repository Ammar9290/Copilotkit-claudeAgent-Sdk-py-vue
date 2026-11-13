<script setup lang="ts">
/**
 * Headless Threads, "Switch between threads": the list and the chat inside one
 * `CopilotChatConfigurationProvider`, on this section's Intelligence runtime
 * (runtime/endpoints/section-a-threads.ts) as the page's first step requires.
 */
import { CopilotChat, CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import ThreadSidebar from "./ThreadSidebar.vue";
</script>

<template>
  <DemoFrame parent-path="/headless-threads" subtitle="agent: headless-threads · /api/copilotkit-section-a-threads">
    <CopilotKitProvider runtime-url="/api/copilotkit-section-a-threads" :enable-inspector="INSPECTOR_ENABLED">
      <!-- [!code highlight:6] -->
      <CopilotChatConfigurationProvider agent-id="headless-threads">
        <div class="flex" style="height: 100%">
          <ThreadSidebar />
          <div class="min-w-0 flex-1"><CopilotChat /></div>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
