<script setup lang="ts">
/**
 * Standard catalog: "Replace a component" (Card → MyCard) and "Drop
 * components" (`standardUI.omit`) combined into one `appUI`.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import { createGenerativeUI, standardUI } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import MyCard from "./MyCard.vue";

// [!code highlight:6]
const appUI = createGenerativeUI({
  id: "acme/app@1",
  extends: [standardUI.omit(["Map", "Video", "HtmlView"])],
  overrides: { Card: { component: MyCard } },
  components: {},
});
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/standard-catalog" subtitle="agent: gen-ui-components-standard-catalog · Card → MyCard">
    <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: appUI }" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat agent-id="gen-ui-components-standard-catalog" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
