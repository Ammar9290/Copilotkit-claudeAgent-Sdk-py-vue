<script setup lang="ts">
/**
 * Markdown mode:
 *   - "Turn it on" (the Vue tab's `src/App.vue`): `transport: 'markdown'`; the
 *     provider sends the schema + writing guide as context, and the Claude
 *     adapter appends the run's context to its system prompt.
 *   - "Build your own prompt": `sendContext: false`; the backend agent
 *     `gen-ui-components-markdown-mode-own-prompt` reads the catalog from
 *     `forwardedProps.copilotkit.ui` with the page's Python lines.
 * The provider remounts on switch so each config starts clean.
 */
import { computed, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import { standardUI } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";

const mode = ref<"context" | "own-prompt">("context");
const agentId = computed(() =>
  mode.value === "context" ? "gen-ui-components-markdown-mode" : "gen-ui-components-markdown-mode-own-prompt",
);
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/markdown-mode" :subtitle="`agent: ${agentId} · transport: markdown`">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <button
          data-mode="context"
          :class="['rounded-md px-2 py-1 font-mono', mode === 'context' ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700']"
          @click="mode = 'context'"
        >
          Turn it on
        </button>
        <button
          data-mode="own-prompt"
          :class="['rounded-md px-2 py-1 font-mono', mode === 'own-prompt' ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700']"
          @click="mode = 'own-prompt'"
        >
          Build your own prompt (sendContext: false)
        </button>
      </div>
      <div class="min-h-0 flex-1">
        <!-- [!code highlight:1] -->
        <CopilotKitProvider v-if="mode === 'context'" key="context" runtime-url="/api/copilotkit" :generativeUI="{ ui: standardUI, transport: 'markdown' }" :enable-inspector="INSPECTOR_ENABLED">
          <CopilotChat agent-id="gen-ui-components-markdown-mode" />
        </CopilotKitProvider>
        <!-- [!code highlight:5] -->
        <CopilotKitProvider
          v-else
          key="own-prompt"
          runtime-url="/api/copilotkit"
          :generativeUI="{ ui: standardUI, transport: 'markdown', sendContext: false }"
          :enable-inspector="INSPECTOR_ENABLED"
        >
          <CopilotChat agent-id="gen-ui-components-markdown-mode-own-prompt" />
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
