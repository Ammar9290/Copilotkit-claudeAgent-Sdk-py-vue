<script setup lang="ts">
/**
 * A2UI overview, the second setup path: "Enable on the runtime without a
 * catalog". The provider gets no `a2ui` prop at all; the runtime at
 * /api/copilotkit-section-c-a2ui sets `a2ui: { injectA2UITool: true }`
 * (frontend/runtime/endpoints/section-c-a2ui.ts), which both applies the
 * middleware and injects `generate_a2ui`.
 *
 * The page's "Colors and dark mode" section is applied too: the
 * `--a2ui-*` variables are set on `.a2ui-surface` in the style block below.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
</script>

<template>
  <DemoFrame parent-path="/generative-ui/a2ui" subtitle="agent: a2ui · runtime a2ui: { injectA2UITool: true } · no catalog">
    <!-- [!code highlight:1] -->
    <CopilotKitProvider runtime-url="/api/copilotkit-section-c-a2ui" :enable-inspector="INSPECTOR_ENABLED">
      <div style="height: 100%">
        <CopilotChat agent-id="a2ui" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>

<style>
/* The page's surface color variables, with this demo's own values. */
.a2ui-surface {
  --a2ui-color-surface: #f5f3ff; /* card, modal, chip and button backgrounds */
  --a2ui-color-border: #c4b5fd; /* borders, tab rule, divider */
  --a2ui-color-muted: #6d28d9; /* captions and secondary text */
  --a2ui-color-error: #dc2626; /* validation errors */
  --a2ui-primary-color: #7c3aed; /* primary buttons, selected chips, active tab */
}
</style>
