<script setup lang="ts">
/**
 * "Put it anywhere in your layout": the page's `src/App.vue`, with `<Canvas />`
 * as the main content and `<CopilotChat />` beside it.
 *
 * Both resolve "the same default agent". This harness names one agent per doc
 * route, so instead of editing either component the tree is wrapped in
 * `CopilotChatConfigurationProvider agent-id=…` (NOT DOC CODE); `useAgent()`
 * and `CopilotChat` both fall back to that id when given none.
 */
import { CopilotChat, CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import Canvas from "./Canvas.vue";
</script>

<template>
  <DemoFrame parent-path="/shared-state/rendering-in-app" subtitle="agent: shared-state-rendering-in-app">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <CopilotChatConfigurationProvider agent-id="shared-state-rendering-in-app">
        <!-- [!code highlight:4] -->
        <div class="app-shell grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
          <Canvas />
          <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><CopilotChat /></div>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
