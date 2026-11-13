<script setup lang="ts">
/**
 * NOT DOC CODE. The page renders a `TimePickerCard` but never publishes it; it
 * only says the picker can use static candidate slots. This one takes the
 * `useHumanInTheLoop` render props (`args`, `status`, `respond`, `result`) and
 * answers the tool with the slot the user picks.
 */
import { ref } from "vue";

const props = defineProps<{
  args: { topic?: string; attendee?: string };
  status: string;
  respond?: (result: unknown) => Promise<void>;
  result?: string;
}>();

const SLOTS = ["Tue 10:00", "Wed 14:30", "Thu 09:00", "Fri 16:00"];
const chosen = ref<string | null>(null);

function pick(slot: string) {
  if (!props.respond || chosen.value) return;
  chosen.value = slot;
  void props.respond({ chosen_time: slot });
}
function decline() {
  if (!props.respond || chosen.value) return;
  chosen.value = "none of these";
  void props.respond({ declined: true });
}
</script>

<template>
  <div
    class="my-2 max-w-md rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm dark:border-violet-900 dark:bg-violet-950/40"
    data-testid="time-picker"
  >
    <p class="font-semibold">Pick a time: {{ args.topic ?? "a meeting" }}</p>
    <p class="text-xs text-slate-600 dark:text-slate-300">with {{ args.attendee ?? "…" }}</p>
    <div v-if="status === 'executing' && !chosen" class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="s in SLOTS"
        :key="s"
        class="rounded-md border border-violet-300 bg-white px-2 py-1 text-xs hover:bg-violet-100 dark:bg-slate-900"
        data-testid="time-slot"
        @click="pick(s)"
      >
        {{ s }}
      </button>
      <button class="px-2 py-1 text-xs text-slate-500 underline" @click="decline">None of these</button>
    </div>
    <p v-else-if="chosen" class="mt-2 text-xs" data-testid="time-picked">Picked: {{ chosen }}</p>
    <p v-else-if="status === 'complete'" class="mt-2 text-xs" data-testid="time-complete">Answered{{ result ? `: ${result}` : "" }}</p>
    <p v-else class="mt-2 text-xs text-slate-500">Preparing…</p>
  </div>
</template>
