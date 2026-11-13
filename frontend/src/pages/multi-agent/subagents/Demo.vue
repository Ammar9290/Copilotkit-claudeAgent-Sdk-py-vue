<script setup lang="ts">
/**
 * Sub-Agents: supervisor chat beside the live delegation log. The agent is the
 * page's Messages API supervisor (`POST /multi-agent-subagents`), bound as
 * `subagents` on `/api/copilotkit-section-e`.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import DelegationLog from "./DelegationLog.vue";
</script>

<template>
  <DemoFrame parent-path="/multi-agent/subagents" subtitle="agent: subagents → POST /multi-agent-subagents · research → write → critique">
    <CopilotKitProvider runtime-url="/api/copilotkit-section-e" :enable-inspector="INSPECTOR_ENABLED">
      <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_24rem]">
        <div class="min-h-0"><CopilotChat agent-id="subagents" /></div>
        <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><DelegationLog /></div>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
