<script setup lang="ts">
/**
 * MCP Apps — "No frontend renderer needed": the page's `src/App.vue`, a plain
 * `CopilotChat` under `CopilotKitProvider`. Everything else is runtime config
 * (`mcpApps.servers`, frontend/runtime/endpoints/section-d-mcp-apps.ts); the
 * built-in MCPAppsActivityRenderer draws the sandboxed iframe.
 *
 * Differences from the sample: the runtime path is this page's own endpoint,
 * and `agent-id` is passed because that runtime has no `default` agent.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame
    parent-path="/generative-ui/mcp-apps"
    subtitle="agent: generative-ui-mcp-apps · /api/copilotkit-section-d-mcp-apps · server: Excalidraw"
  >
    <!-- [!code highlight:3] -->
    <CopilotKitProvider runtime-url="/api/copilotkit-section-d-mcp-apps" :enable-inspector="INSPECTOR_ENABLED">
      <main style="height: 100%"><CopilotChat agent-id="generative-ui-mcp-apps" /></main>
    </CopilotKitProvider>
  </DemoFrame>
</template>
