<script setup lang="ts">
/**
 * Open Generative UI. The page publishes only React for the frontend, so this
 * is a port to the Vue provider, which takes the same `openGenerativeUI` prop.
 *
 * - Minimal cell: a plain `CopilotChat`; the built-in
 *   OpenGenerativeUIActivityRenderer is registered by the provider. The page's
 *   minimal cell also passes `designSkill: VISUALIZATION_DESIGN_SKILL`, but
 *   never publishes that constant, so the default design skill is kept.
 * - Advanced cell: `openGenerativeUI.sandboxFunctions` with the page's two
 *   functions (./sandbox-functions.ts). The runtime is the same for both.
 *
 * Runtime: frontend/runtime/endpoints/section-d-ogui.ts.
 */
import { CopilotChat, CopilotKitProvider, type SandboxFunction } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import { openGenUiSandboxFunctions } from "./sandbox-functions";

// Type-only widening: the page's handlers take typed args (`{ expression }`),
// while Vue 1.87.0's `SandboxFunction.handler` is `(args: unknown) => unknown`,
// so the array as published fails vue-tsc. Runtime value is unchanged.
const sandboxFunctions = openGenUiSandboxFunctions as unknown as SandboxFunction[];
</script>

<template>
  <DemoFrame parent-path="/generative-ui/open-generative-ui" subtitle="agent: open-gen-ui · /api/copilotkit-section-d-ogui">
    <!-- [!code highlight:5] -->
    <CopilotKitProvider
      runtime-url="/api/copilotkit-section-d-ogui"
      :openGenerativeUI="{ sandboxFunctions }"
      :enable-inspector="INSPECTOR_ENABLED"
    >
      <div class="mx-auto flex h-full w-full max-w-4xl flex-col p-3">
        <CopilotChat agent-id="open-gen-ui" class="min-h-0 flex-1" />
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
