<script setup lang="ts">
/**
 * "Custom Components": a component of our own rendered inside a slot. Once a
 * slot is replaced, this component owns that part's rendering, so it only
 * shows the text (no edit/copy toolbar, no branch navigation).
 */
import { computed } from "vue";

const props = defineProps<{ message: { id: string; content?: unknown } }>();
const text = computed(() =>
  typeof props.message.content === "string" ? props.message.content : JSON.stringify(props.message.content),
);
</script>

<template>
  <div class="custom-user-message my-2 flex justify-end" data-testid="custom-user-message">
    <div class="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white">
      <span class="mr-2 text-[10px] font-semibold uppercase tracking-wide opacity-70">you</span>{{ text }}
    </div>
  </div>
</template>
