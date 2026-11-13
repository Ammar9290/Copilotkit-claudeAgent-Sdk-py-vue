<script setup lang="ts">
/**
 * "Capture message feedback" (Open, close, and feedback page): the default
 * assistant message rendered through `message-view` → `assistant-message`, with
 * `@thumbs-up` / `@thumbs-down` observed. The page's `analytics.track` is your
 * own analytics; here it is an on-screen log.
 *
 * Also wires the CopilotChat page's observable events (`@submit-message`,
 * `@input-change`, `@select-suggestion`, `@stop`) into the same log.
 */
import { ref } from "vue";
import {
  CopilotChat,
  CopilotChatAssistantMessage,
  CopilotChatMessageView,
} from "@copilotkit/vue/v2";

const events = ref<string[]>([]);
const log = (line: string) => {
  events.value = [`${new Date().toLocaleTimeString()}  ${line}`, ...events.value].slice(0, 30);
};

const analytics = {
  track: (name: string, payload: Record<string, unknown>) => log(`${name} ${JSON.stringify(payload)}`),
};

function recordFeedback(message: { id: string }, value: "up" | "down") {
  analytics.track("feedback", { messageId: message.id, value });
}
</script>

<template>
  <div class="flex h-full">
    <div class="min-w-0 flex-1">
      <CopilotChat
        agent-id="prebuilt-components"
        auto-scroll="pin-to-bottom"
        @submit-message="(v: string) => log(`submit-message: ${v}`)"
        @select-suggestion="(s: { title: string }) => log(`select-suggestion: ${s.title}`)"
        @stop="log('stop')"
      >
        <!-- [!code highlight:13] -->
        <template #message-view="{ messages, isRunning }">
          <CopilotChatMessageView :messages="messages" :is-running="isRunning">
            <template #assistant-message="{ message, messages: allMessages, isRunning: running }">
              <CopilotChatAssistantMessage
                :message="message"
                :messages="allMessages"
                :is-running="running"
                @thumbs-up="recordFeedback($event, 'up')"
                @thumbs-down="recordFeedback($event, 'down')"
              />
            </template>
          </CopilotChatMessageView>
        </template>
      </CopilotChat>
    </div>
    <aside class="hidden w-72 shrink-0 overflow-y-auto border-l border-slate-200 p-3 md:block dark:border-slate-800">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Chat events</p>
      <ol class="mt-2 space-y-1 font-mono text-[11px] break-all" data-testid="chat-events">
        <li v-for="(e, i) in events" :key="i">{{ e }}</li>
      </ol>
      <p v-if="events.length === 0" class="mt-2 text-xs text-slate-400">Send a message, then use 👍 / 👎 on the reply.</p>
    </aside>
  </div>
</template>
