<script setup lang="ts">
/**
 * JSON Render: the backend half only.
 *
 * The page's frontend is React glue: `JsonRenderAssistantMessage` installed in
 * `<CopilotChat messageView={{ assistantMessage }}>`, rendering through
 * `JSONUIProvider` + `Renderer` from `@json-render/react` against a
 * `defineCatalog` / `defineRegistry` pair (Zod 4). None of those packages is
 * installed in this repo, and no renderer is improvised here. The chat is the
 * stock Vue `CopilotChat`, so the agent's `{ root, elements }` spec arrives as
 * the plain assistant message: that is the part of the page this demo shows.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/json-render" subtitle="agent: json-render · spec only, no @json-render renderer">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat agent-id="json-render" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
