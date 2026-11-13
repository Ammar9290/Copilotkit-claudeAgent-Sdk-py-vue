<script setup lang="ts">
/**
 * `src/components/AgentExperience.vue` from Tool Call Rendering, verbatim
 * except the agent id.
 *
 * Note the page's own mismatch: the renderer's schema is `{ city }` while the
 * backend tool it publishes (`GET_WEATHER_TOOL`) takes `{ location }`. Kept as
 * published — `parameters.city` is therefore undefined at runtime (see the notes page).
 */
import { z } from "zod";
import { CopilotChat, useDefaultRenderTool, useRenderTool } from "@copilotkit/vue/v2";
import WeatherToolCard from "./WeatherToolCard.vue";

// [!code highlight:6]
useRenderTool({
  name: "get_weather",
  parameters: z.object({ city: z.string() }),
  // Verbatim, but the page's WeatherToolCard (props: parameters/status/result only) does not
  // typecheck against 1.87.0's `Component<RenderToolProps>` (see the notes page). Widened, not changed.
  render: WeatherToolCard as never,
});
useDefaultRenderTool(); // wildcard fallback for every other tool
</script>

<template><CopilotChat agent-id="generative-ui-tool-rendering" /></template>
