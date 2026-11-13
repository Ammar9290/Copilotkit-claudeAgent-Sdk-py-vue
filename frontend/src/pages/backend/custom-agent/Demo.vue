<script setup lang="ts">
/**
 * Use any model router — the frontend is the page's "same as BuiltInAgent"
 * setup: a provider and a chat. The page's code is on the runtime
 * (frontend/runtime/endpoints/section-f-router.ts): one `BuiltInAgent`
 * factory per tab/example, each under its own key, picked here by agent-id.
 *
 * The raw AG-UI events panel shows what each factory actually streamed — for
 * the model-backed ones, the RUN_ERROR naming the missing API key.
 */
import { ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RawEvents from "../RawEvents.vue";

const AGENTS = [
  { id: "custom-tools", label: "Custom · With Tools (no model)" },
  { id: "aisdk", label: "AI SDK · openai(gpt-6-luna)" },
  { id: "tanstack", label: "TanStack AI · openaiText(gpt-6-luna)" },
  { id: "custom", label: "Custom · fetch your-llm-api.com" },
  { id: "aisdk-reasoning", label: "AI SDK · anthropic thinking" },
] as const;
const agentId = ref<(typeof AGENTS)[number]["id"]>("custom-tools");
</script>

<template>
  <DemoFrame parent-path="/backend/custom-agent" subtitle="BuiltInAgent factory mode · /api/copilotkit-section-f-router">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <span class="text-slate-500">factory:</span>
        <button
          v-for="a in AGENTS"
          :key="a.id"
          :data-testid="`agent-${a.id}`"
          :class="[
            'rounded-md px-2 py-1',
            agentId === a.id ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700',
          ]"
          @click="agentId = a.id"
        >
          {{ a.label }}
        </button>
      </div>
      <div class="min-h-0 flex-1">
        <CopilotKitProvider :key="agentId" runtime-url="/api/copilotkit-section-f-router" :enable-inspector="INSPECTOR_ENABLED">
          <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
            <div class="min-h-0"><CopilotChat :agent-id="agentId" /></div>
            <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><RawEvents :agent-id="agentId" /></div>
          </div>
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
