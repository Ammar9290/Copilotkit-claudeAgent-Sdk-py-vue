<script setup lang="ts">
/**
 * Fully Headless UI — both of the page's examples, under one
 * `CopilotKitProvider` and one `CopilotChatConfigurationProvider` as the page
 * prescribes. They resolve the same agent instance, so a message sent from the
 * minimal composer (left) also appears in the complete example (right).
 */
import { CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import HeadlessChat from "./HeadlessChat.vue";
import RenderedMessages from "./RenderedMessages.vue";
</script>

<template>
  <DemoFrame
    parent-path="/custom-look-and-feel/headless-ui"
    subtitle="agent: custom-look-and-feel-headless-ui · no CopilotChat shell"
  >
    <!-- [!code highlight:5] -->
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <CopilotChatConfigurationProvider agent-id="custom-look-and-feel-headless-ui">
        <div class="grid h-full grid-cols-1 md:grid-cols-2">
          <div class="flex min-h-0 flex-col border-r border-slate-200 dark:border-slate-800">
            <p class="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
              Minimal: useAgent + useCopilotKit
            </p>
            <div class="min-h-0 flex-1"><HeadlessChat /></div>
          </div>
          <div class="flex min-h-0 flex-col">
            <p class="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800">
              Complete: CopilotChatMessageView in custom bubbles
            </p>
            <div class="min-h-0 flex-1 overflow-y-auto p-4"><RenderedMessages /></div>
          </div>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
