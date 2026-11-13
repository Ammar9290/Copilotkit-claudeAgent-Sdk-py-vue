<script setup lang="ts">
/**
 * NOT DOC CODE (markup). "Send a click to the agent" shows only the event
 * declaration `onChoose: { description, parameters: z.object({ plan }) }`, not
 * a component. This is the smallest component that fires it.
 */
import { ref } from "vue";
import type { GenerativeUIInvokeResult } from "@copilotkit/vue/v2/generative-ui";

const props = defineProps<{
  plan: string;
  onChoose?: (args: { plan: string }) => Promise<GenerativeUIInvokeResult>;
}>();
const error = ref<string>();

async function choose() {
  const result = await props.onChoose?.({ plan: props.plan });
  if (result && !result.ok) error.value = result.error.message;
}
</script>

<template>
  <span class="inline-flex flex-col">
    <button
      v-if="onChoose"
      class="rounded-md border border-slate-300 px-3 py-1 text-xs dark:border-slate-700"
      data-testid="plan-button"
      @click="choose"
    >
      Show me the {{ plan }} plan
    </button>
    <span v-if="error" role="alert" class="text-xs text-rose-600">{{ error }}</span>
  </span>
</template>
