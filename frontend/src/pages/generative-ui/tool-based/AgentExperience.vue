<script setup lang="ts">
/** `src/components/AgentExperience.vue` from Components as Tools, verbatim except the agent id. */
import { z } from "zod";
import { CopilotChat, useComponent } from "@copilotkit/vue/v2";
import WeatherCard from "./WeatherCard.vue";

// [!code highlight:10]
useComponent({
  name: "show_weather",
  description: "Display the weather for one city.",
  parameters: z.object({
    city: z.string(),
    temperature: z.number(),
    condition: z.string(),
  }),
  render: WeatherCard,
});
</script>

<template><CopilotChat agent-id="generative-ui-tool-based" /></template>
