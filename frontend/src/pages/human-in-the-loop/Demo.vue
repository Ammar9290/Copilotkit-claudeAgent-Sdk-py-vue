<script setup lang="ts">
/**
 * HITL Overview, Pattern 1: mount the registration component beneath
 * `CopilotKitProvider`, beside a chat. Pattern 2 (`useInterrupt`) is only
 * pointed at from this page; its walkthrough is a separate doc page.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import MeetingApproval from "./MeetingApproval.vue";
</script>

<template>
  <DemoFrame parent-path="/human-in-the-loop" subtitle="agent: human-in-the-loop · useHumanInTheLoop schedule_meeting">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <div class="flex h-full flex-col">
        <!-- [!code highlight:1] -->
        <MeetingApproval />
        <div class="min-h-0 flex-1"><CopilotChat agent-id="human-in-the-loop" /></div>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
