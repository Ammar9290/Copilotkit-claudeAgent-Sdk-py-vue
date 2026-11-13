<script setup lang="ts">
/**
 * The Quickstart's `src/App.vue`: `CopilotKitProvider` pointed at the runtime,
 * with a full-height `CopilotChat` inside it.
 *
 * The runtime URL is the absolute cross-origin one the page shows. Vite and the
 * runtime are on separate origins, which is why the runtime has `cors: true`.
 * The port comes from VITE_RUNTIME_ORIGIN.
 *
 * As in the page's sample, `<CopilotChat />` gets no `agent-id`, so it uses the
 * runtime's `default` agent. Here that agent is the Claude Agent SDK (Python)
 * adapter rather than the page's BuiltInAgent.
 */
// [!code highlight:2]
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED, RUNTIME_ORIGIN } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/quickstart" subtitle="agent: default · cross-origin runtime">
    <!-- [!code highlight:7] -->
    <CopilotKitProvider :runtime-url="`${RUNTIME_ORIGIN}/api/copilotkit`" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
