<script setup lang="ts">
/**
 * "Complete example" — `RenderedMessages.vue` from the page: our own bubble
 * chrome around the public message leaves, so markdown, toolbars, tool calls
 * and reasoning keep their built-in rendering.
 */
import { computed } from "vue";
import {
  CopilotChatAssistantMessage,
  CopilotChatMessageView,
  CopilotChatUserMessage,
  useAgent,
} from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "custom-look-and-feel-headless-ui" });
const messages = computed(() => agent.value?.messages ?? []);
const isRunning = computed(() => agent.value?.isRunning ?? false);
</script>

<template>
  <CopilotChatMessageView :messages="messages" :is-running="isRunning">
    <template #assistant-message="assistantProps">
      <article class="assistant-bubble" data-testid="assistant-bubble">
        <CopilotChatAssistantMessage v-bind="assistantProps" />
      </article>
    </template>
    <template #user-message="userProps">
      <article class="user-bubble" data-testid="user-bubble">
        <CopilotChatUserMessage v-bind="userProps" />
      </article>
    </template>
  </CopilotChatMessageView>
</template>

<style scoped>
.assistant-bubble {
  margin: 0.5rem 0;
  border-left: 3px solid var(--accent);
  padding-left: 0.75rem;
}
.user-bubble {
  margin: 0.5rem 0;
  border-right: 3px solid #64748b;
  padding-right: 0.75rem;
}
</style>
