<script setup lang="ts">
/** `src/components/RetryFallback.vue` from the Surfaces page, verbatim. */
import type { GenerativeUIErrorFallbackProps } from "@copilotkit/vue/v2/generative-ui";

defineProps<GenerativeUIErrorFallbackProps>();
</script>

<template>
  <button @click="retry">Try again</button>
</template>
