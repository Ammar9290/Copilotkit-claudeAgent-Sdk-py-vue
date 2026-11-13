<script setup lang="ts">
/**
 * `src/components/ThreadSidebar.vue` from Headless Threads, plus the page's
 * pagination step (`limit` + `fetchMoreThreads`). Additions, each so the
 * outcome is visible: the `error` ref is shown, Rename asks for a name instead
 * of the page's fixed 'Renamed', and a "New" button calls the configuration's
 * `startNewThread()` (the lifecycle page's recommendation for custom sidebars).
 */
import { useCopilotChatConfiguration, useThreads } from "@copilotkit/vue/v2";

const config = useCopilotChatConfiguration();
const {
  threads,
  isLoading,
  error,
  renameThread,
  archiveThread,
  deleteThread,
  hasMoreThreads,
  isFetchingMoreThreads,
  fetchMoreThreads,
} = useThreads({ agentId: "headless-threads", limit: 20 });

function rename(id: string, current: string | null) {
  const name = window.prompt("New name", current ?? "");
  if (name) void renameThread(id, name);
}
</script>

<template>
  <aside class="flex w-72 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
    <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">useThreads</p>
      <button
        type="button"
        data-testid="new-thread"
        class="rounded border border-slate-300 px-2 py-0.5 text-xs dark:border-slate-700"
        @click="config?.startNewThread()"
      >
        New
      </button>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto p-2">
      <p v-if="isLoading" class="p-2 text-sm text-slate-500">Loading…</p>
      <p v-else-if="error" class="p-2 text-xs break-words text-rose-600" data-testid="threads-error">{{ error.message }}</p>
      <p v-else-if="threads.length === 0" class="p-2 text-xs text-slate-500">No threads yet. Send a message.</p>
      <ul v-else class="space-y-1" data-testid="thread-list">
        <li
          v-for="thread in threads"
          :key="thread.id"
          :class="[
            'rounded-md p-2 text-sm',
            thread.id === config?.threadId ? 'bg-slate-100 dark:bg-slate-800' : '',
          ]"
        >
          <!-- [!code highlight:3] -->
          <button class="block w-full truncate text-left font-medium" @click="config?.setActiveThreadId(thread.id, { explicit: true })">
            {{ thread.name ?? "New conversation" }}
          </button>
          <div class="mt-1 flex gap-2 text-xs text-slate-500">
            <button @click="rename(thread.id, thread.name)">Rename</button>
            <button @click="archiveThread(thread.id)">Archive</button>
            <button class="text-rose-600" @click="deleteThread(thread.id)">Delete</button>
          </div>
        </li>
      </ul>
      <button
        v-if="hasMoreThreads"
        :disabled="isFetchingMoreThreads"
        class="mt-2 w-full rounded border border-slate-300 py-1 text-xs dark:border-slate-700"
        @click="fetchMoreThreads"
      >
        {{ isFetchingMoreThreads ? "Loading…" : "Load more" }}
      </button>
    </div>
  </aside>
</template>
