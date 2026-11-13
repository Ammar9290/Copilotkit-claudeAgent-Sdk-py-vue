<script setup lang="ts">
/**
 * Slots — the page's samples composed into one chat:
 *
 *   - `welcome-screen`                                  "Welcome screen slot"
 *   - `message-view` (+ class)                          "Tailwind Classes"
 *     → `assistant-message` → `toolbar-items`           "Assistant message slot"
 *     → `copy-button="{ onCopy }"`                      "Three levels deep"
 *     → `user-message` → custom component               "Custom Components" (leaf level)
 *   - `input` → `disclaimer`                            "Disclaimer slot"
 *   - `labels`                                          "Labels"
 */
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatInput,
  CopilotChatMessageView,
  CopilotKitProvider,
} from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import CustomUserMessage from "./CustomUserMessage.vue";

/**
 * "Labels" — the page's strings. In @copilotkit/vue 1.87.0 `CopilotChatLabels`
 * types each field as its *default literal* (e.g. `"Type a message..."`), so
 * the page's inline object does not typecheck. Cast here; the runtime value is
 * the page's. `chatDisclaimerText` is left out because the disclaimer slot
 * replaces that text.
 */
const labels = {
  chatInputPlaceholder: "Ask your agent anything…",
  welcomeMessageText: "How can I help you today?",
} as never;
</script>

<template>
  <DemoFrame parent-path="/custom-look-and-feel/slots" subtitle="agent: custom-look-and-feel-slots">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <div class="h-full">
        <CopilotChat agent-id="custom-look-and-feel-slots" :labels="labels">
          <!-- [!code highlight:9] -->
          <template #welcome-screen="{ onSubmitMessage }">
            <section class="welcome-card" data-testid="custom-welcome">
              <h2>How can we help?</h2>
              <button type="button" class="welcome-action" @click="onSubmitMessage('Show my open tickets')">
                Show my open tickets
              </button>
            </section>
          </template>

          <!-- [!code highlight:21] -->
          <template #message-view="{ messages, isRunning }">
            <CopilotChatMessageView
              class="rounded-xl bg-gray-50 p-4 dark:bg-gray-900"
              :messages="messages"
              :is-running="isRunning"
            >
              <template #assistant-message="{ message, messages: allMessages, isRunning: running }">
                <CopilotChatAssistantMessage :message="message" :messages="allMessages" :is-running="running">
                  <template #toolbar-items>
                    <span class="reviewed-badge" data-testid="reviewed-badge">Reviewed</span>
                  </template>
                  <template #copy-button="{ onCopy }">
                    <button type="button" class="copy-response" @click="onCopy">Copy response</button>
                  </template>
                </CopilotChatAssistantMessage>
              </template>
              <template #user-message="{ message }">
                <CustomUserMessage :message="message" />
              </template>
            </CopilotChatMessageView>
          </template>

          <!-- [!code highlight:7] -->
          <template #input="inputProps">
            <CopilotChatInput v-bind="inputProps">
              <template #disclaimer>
                <p class="support-disclaimer">Responses may be inaccurate.</p>
              </template>
            </CopilotChatInput>
          </template>
        </CopilotChat>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>

<style scoped>
.welcome-card {
  margin: 4rem auto;
  max-width: 28rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #fff7ed, #fff);
  color: #0f172a;
}
.welcome-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
}
.welcome-card button.welcome-action {
  margin-top: 1rem;
  border-radius: 9999px;
  background: #c2603d;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #fff;
}
.reviewed-badge {
  border-radius: 9999px;
  background: #dcfce7;
  padding: 0.1rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #166534;
}
.copy-response {
  font-size: 0.75rem;
  text-decoration: underline;
}
.support-disclaimer {
  padding: 0.25rem;
  text-align: center;
  font-size: 0.75rem;
  color: #b45309;
}
</style>
