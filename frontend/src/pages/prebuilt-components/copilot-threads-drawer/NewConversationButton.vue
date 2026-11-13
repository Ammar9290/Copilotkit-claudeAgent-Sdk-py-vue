<script setup lang="ts">
/** `src/components/NewConversationButton.vue` from the Threads Drawer page (classes added). */
import { useCopilotChatConfiguration } from "@copilotkit/vue/v2";

const configuration = useCopilotChatConfiguration();

function startNewConversation() {
  configuration.value?.startNewThread();
}
</script>

<template>
  <button
    type="button"
    data-testid="new-conversation"
    class="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium dark:border-slate-700"
    @click="startNewConversation"
  >
    New conversation
  </button>
</template>
