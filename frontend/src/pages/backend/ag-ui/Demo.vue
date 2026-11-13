<script setup lang="ts">
/**
 * Connect AG-UI agents: a chat, the page's `agent.subscribe(...)` callback log,
 * and the raw AG-UI event stream, all on the same runtime-proxied agent.
 *
 * The agent is reached the way the page's "proxy pattern" describes: the
 * provider asks `/api/copilotkit/info`, gets a proxy for `section-f-ag-ui`,
 * and the runtime forwards runs to the Python ClaudeAgentAdapter.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RawEvents from "../RawEvents.vue";
import EventLog from "./EventLog.vue";
</script>

<template>
  <DemoFrame parent-path="/backend/ag-ui" subtitle="agent: section-f-ag-ui · agent.subscribe(...) · /api/copilotkit">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_22rem_22rem]">
        <div class="min-h-0"><CopilotChat agent-id="section-f-ag-ui" /></div>
        <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><EventLog /></div>
        <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><RawEvents agent-id="section-f-ag-ui" /></div>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
