<script setup lang="ts">
/**
 * Built-in Agent — a `BuiltInAgent({ model, prompt, tools })` that the runtime
 * runs in-process (frontend/runtime/endpoints/section-f-bia.ts), registered as
 * `default`. The frontend is the Quickstart's: a provider and a chat with no
 * agent-id. There is no Python agent behind this page.
 *
 * The header card shows how the runtime advertises the agent on `/info`
 * (`className: "BuiltInAgent"`); the raw events panel shows what the run
 * actually streamed.
 */
import { onMounted, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RawEvents from "../backend/RawEvents.vue";

const info = ref<string>("…");
onMounted(async () => {
  try {
    const body = (await (await fetch("/api/copilotkit-section-f-bia/info")).json()) as {
      agents: Record<string, { className: string }>;
    };
    info.value = Object.entries(body.agents)
      .map(([key, a]) => `${key} → ${a.className}`)
      .join(", ");
  } catch (error) {
    info.value = String(error);
  }
});
</script>

<template>
  <DemoFrame parent-path="/built-in-agent" subtitle="BuiltInAgent in the runtime · /api/copilotkit-section-f-bia">
    <div class="flex h-full flex-col">
      <p class="shrink-0 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <span class="text-slate-500">GET /info agents:</span> <code data-testid="bia-info">{{ info }}</code>
      </p>
      <div class="min-h-0 flex-1">
        <CopilotKitProvider runtime-url="/api/copilotkit-section-f-bia" :enable-inspector="INSPECTOR_ENABLED">
          <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
            <div class="min-h-0"><CopilotChat /></div>
            <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><RawEvents /></div>
          </div>
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
