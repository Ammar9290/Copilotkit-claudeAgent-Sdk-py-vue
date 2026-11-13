<script setup lang="ts">
/**
 * `src/components/ThreadControls.vue` from the lifecycle page. The page passes
 * `existingId` as a prop; here it is the thread that was active before the
 * last switch, so "Open conversation" exercises explicit replay of a thread
 * that really ran. The live `threadId` is printed for the recording.
 *
 * "Mint up front and drive the id" is the extra button: the page's
 * `startConversation()` with `myApi.createThread()` standing in for your API.
 */
import { ref, watch } from "vue";
import { useCopilotChatConfiguration } from "@copilotkit/vue/v2";
import { myApi } from "./myApi";

const config = useCopilotChatConfiguration();
const existingId = ref<string>();

watch(
  () => config.value?.threadId,
  (_id, previous) => {
    if (previous && previous !== existingId.value) existingId.value = previous;
  },
);

async function startConversation() {
  const { id } = await myApi.createThread();
  config.value?.setActiveThreadId(id, { explicit: true });
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
    <span class="text-xs text-slate-500">threadId</span>
    <code class="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800" data-testid="thread-id">{{ config?.threadId }}</code>
    <!-- [!code highlight:7] -->
    <button
      :disabled="!existingId"
      data-testid="open-conversation"
      class="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-700"
      @click="existingId && config?.setActiveThreadId(existingId, { explicit: true })"
    >
      Open conversation
    </button>
    <button data-testid="new-chat" class="rounded-md bg-[var(--accent)] px-2 py-1 text-xs text-white" @click="config?.startNewThread()">
      New chat
    </button>
    <button
      data-testid="mint-up-front"
      class="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
      @click="startConversation"
    >
      New chat via myApi.createThread()
    </button>
    <span v-if="existingId" class="text-xs text-slate-500">
      previous: <code data-testid="previous-id">{{ existingId.slice(0, 13) }}…</code>
    </span>
  </div>
</template>
