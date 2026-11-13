<script setup lang="ts">
/** "Pattern 1 — useHumanInTheLoop": `src/components/MeetingApproval.vue` as printed. */
import { z } from "zod";
import { useHumanInTheLoop } from "@copilotkit/vue/v2";
import TimePickerCard from "./TimePickerCard.vue";

// [!code highlight:12]
useHumanInTheLoop({
  name: "schedule_meeting",
  description: "Ask the user to select a meeting time.",
  parameters: z.object({
    topic: z.string(),
    attendee: z.string(),
  }),
  // `as never` (NOT DOC CODE): as printed this fails vue-tsc — a component
  // instance type lacks name/description/toolCallId of the render-props union.
  render: TimePickerCard as never,
});
</script>

<template><p class="px-4 py-1 text-xs text-slate-400">Meeting approval tool registered.</p></template>
