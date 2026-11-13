<script setup lang="ts">
/**
 * "Starter suggestions": `useConfigureSuggestions` in a child of
 * `CopilotKitProvider`, so the nearest chat surface picks the config up.
 * The page names the composable but shows no config, so these two pills are
 * this harness's own.
 *
 * `consumerAgentId` is set on purpose. With the default ("*"), the Vue
 * composable reloads suggestions only for agents already registered when it
 * mounts. The runtime's agents arrive later (after /info), so the pills only
 * showed up after the first reply, never on the welcome screen
 * (@copilotkit/vue 1.87.0).
 */
import { useConfigureSuggestions } from "@copilotkit/vue/v2";

useConfigureSuggestions({
  consumerAgentId: "prebuilt-components",
  suggestions: [
    { title: "Write a haiku", message: "Write me a haiku about Vue." },
    { title: "What can you do?", message: "Tell me in one sentence what you can do." },
  ],
  available: "always",
});
</script>

<template><slot /></template>
