<script setup lang="ts">
/**
 * Transports: the page's three Vue provider samples — tool transport (the
 * default), markdown transport, and "Only some agents" (`agentIds`) — behind a
 * switch. The provider remounts on change so each config starts clean.
 * The runtime endpoint is the page's `generativeUI: true` sample
 * (runtime/endpoints/section-b-transports.ts).
 */
import { computed, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import { standardUI } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";

const mode = ref<"tool" | "markdown" | "other-agent-only">("tool");

const generativeUI = computed(() => {
  if (mode.value === "markdown") return { ui: standardUI, transport: "markdown" as const };
  // "Only some agents": the catalog is offered to `shop` only, so this
  // page's agent gets no catalog and should answer in plain text.
  if (mode.value === "other-agent-only") return { ui: standardUI, agentIds: ["shop"] };
  return { ui: standardUI };
});
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/transports" subtitle="agent: gen-ui-components-transports">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <button
          v-for="m in ['tool', 'markdown', 'other-agent-only'] as const"
          :key="m"
          :class="['rounded-md px-2 py-1 font-mono', mode === m ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700']"
          @click="mode = m"
        >
          {{ m }}
        </button>
        <code class="text-slate-500">:generativeUI="{{ JSON.stringify({ ...generativeUI, ui: 'standardUI' }) }}"</code>
      </div>
      <div class="min-h-0 flex-1">
        <CopilotKitProvider :key="mode" runtime-url="/api/copilotkit-section-b-transports" :generativeUI="generativeUI" :enable-inspector="INSPECTOR_ENABLED">
          <CopilotChat agent-id="gen-ui-components-transports" />
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
