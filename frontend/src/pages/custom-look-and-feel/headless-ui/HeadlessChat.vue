<script setup lang="ts">
/**
 * "Minimal example" — `HeadlessChat.vue` from the Fully Headless UI page. Only
 * the agent id and the Tailwind classes on the markup differ from the page.
 */
import { computed, ref } from "vue";
import { useAgent, useCopilotKit } from "@copilotkit/vue/v2";

const { agent } = useAgent({ agentId: "custom-look-and-feel-headless-ui" });
const { copilotkit } = useCopilotKit();
const input = ref("");
const messages = computed(() => agent.value?.messages ?? []);
const isRunning = computed(() => agent.value?.isRunning ?? false);

async function submit() {
  const current = agent.value;
  const content = input.value.trim();
  if (!current || !content || isRunning.value) return;

  current.addMessage({
    id: crypto.randomUUID(),
    role: "user",
    content,
  });
  input.value = "";
  await copilotkit.value.runAgent({ agent: current });
}
</script>

<template>
  <section aria-live="polite" class="flex h-full flex-col">
    <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
      <article
        v-for="message in messages"
        :key="message.id"
        :data-role="message.role"
        :class="[
          'headless-message max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm',
          message.role === 'user' ? 'ml-auto bg-[var(--accent)] text-white' : 'bg-slate-100 dark:bg-slate-800',
        ]"
      >
        {{ message.content }}
      </article>
      <p v-if="isRunning" class="text-xs text-slate-500">Thinking…</p>
    </div>
    <form class="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800" @submit.prevent="submit">
      <input
        v-model="input"
        aria-label="Message"
        placeholder="Your own composer…"
        class="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <button
        type="submit"
        :disabled="isRunning"
        class="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        Send
      </button>
    </form>
  </section>
</template>
