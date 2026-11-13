<script setup lang="ts">
/**
 * Debug panel (repo-authored, not doc code): every AG-UI event the resolved
 * agent receives, as raw JSON, via the catch-all `onEvent` subscriber.
 *
 * It must sit inside a `CopilotKitProvider`. `useAgent({ agentId })` resolves
 * the same agent the chat uses (a runtime proxy, or the local HttpAgent for a
 * direct connection), so what shows here is exactly what streamed in.
 */
import { ref, watch } from "vue";
import { useAgent } from "@copilotkit/vue/v2";

const props = defineProps<{ agentId?: string; title?: string }>();

const { agent } = useAgent({ agentId: () => props.agentId });
const events = ref<{ type: string; json: string }[]>([]);
const open = ref<number | null>(null);

watch(
  agent,
  (current, _prev, onCleanup) => {
    if (!current) return;
    const sub = current.subscribe({
      onEvent: ({ event }) => {
        events.value = [...events.value.slice(-299), { type: String(event.type), json: JSON.stringify(event, null, 2) }];
      },
    });
    onCleanup(() => sub.unsubscribe());
  },
  { immediate: true },
);

const TONE: Record<string, string> = {
  RUN_STARTED: "text-emerald-600",
  RUN_FINISHED: "text-emerald-600",
  RUN_ERROR: "text-red-600",
};
</script>

<template>
  <section class="flex h-full min-h-0 flex-col bg-slate-50 dark:bg-slate-900">
    <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
      <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ title ?? "Raw AG-UI events" }} (<span data-testid="raw-event-count">{{ events.length }}</span>)
      </p>
      <button class="text-xs underline" @click="events = []">clear</button>
    </div>
    <p v-if="!events.length" class="p-3 text-xs text-slate-500">Send a message — each event the agent streams appears here.</p>
    <ol class="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-[11px]" data-testid="raw-events">
      <li
        v-for="(e, i) in events"
        :key="i"
        :data-event-type="e.type"
        class="border-b border-slate-200 py-0.5 dark:border-slate-800"
      >
        <button class="w-full truncate text-left" @click="open = open === i ? null : i">
          <span :class="TONE[e.type] ?? 'text-[var(--accent)]'">{{ e.type }}</span>
          <span class="text-slate-500"> {{ e.json.replace(/\s+/g, " ").slice(0, 140) }}</span>
        </button>
        <pre v-if="open === i" class="mt-1 max-h-72 overflow-auto rounded bg-slate-950 p-2 text-slate-200">{{ e.json }}</pre>
      </li>
    </ol>
  </section>
</template>
