<script setup lang="ts">
/** "Tool-call approval with useHumanInTheLoop": `src/components/GovernedActionTool.vue` as printed. */
import { z } from "zod";
import { useHumanInTheLoop } from "@copilotkit/vue/v2";
import GovernedActionCard from "./GovernedActionCard.vue";

const governedActionSchema = z.object({
  id: z.string(),
  summary: z.string(),
  tool: z.string(),
  reference: z.string(),
  verdict: z.enum(["allow", "deny", "require_approval"]),
  arguments: z.record(z.unknown()),
});

// [!code highlight:9]
useHumanInTheLoop({
  name: "approve_governed_action",
  description:
    "Ask the user to approve a governed side-effect action before it runs.",
  parameters: governedActionSchema,
  // `as never` (NOT DOC CODE): the page's card declares only args/respond, so
  // as printed this line fails vue-tsc (TS2322: missing name, description, toolCallId).
  render: GovernedActionCard as never,
});
</script>

<template><p class="px-4 py-1 text-xs text-slate-400">Governed action tool registered.</p></template>
