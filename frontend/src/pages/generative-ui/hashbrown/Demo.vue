<script setup lang="ts">
/**
 * Hashbrown: the backend half only.
 *
 * The page's frontend is `@hashbrownai/react` (`useUiKit`, `exposeComponent`,
 * `exposeMarkdown`, `useJsonParser`) wrapped in a React context and installed
 * in `<CopilotChat messageView={{ assistantMessage }}>`. Hashbrown publishes no
 * Vue package (`@hashbrownai/vue` is a 404 on npm), so there is nothing to
 * port to. The chat is the stock Vue `CopilotChat`: the agent's streamed
 * `{ "ui": [...] }` envelope arrives as the plain assistant message.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/hashbrown" subtitle="agent: hashbrown · envelope only, no Hashbrown renderer">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat agent-id="hashbrown" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
