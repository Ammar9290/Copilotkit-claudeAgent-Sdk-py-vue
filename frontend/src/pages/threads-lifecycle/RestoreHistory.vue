<script setup lang="ts">
/**
 * "Manual hydration" — `src/components/RestoreHistory.vue` from the lifecycle
 * page; only the agent id differs. `myApi.getMessages` is the stand-in store
 * in ./myApi.ts.
 */
import { watch } from "vue";
import { useAgent } from "@copilotkit/vue/v2";
import { myApi } from "./myApi";

const props = defineProps<{ threadId: string }>();
const { agent } = useAgent({ agentId: "threads-lifecycle" });

watch(
  [() => agent.value, () => props.threadId],
  async ([current, threadId], _previous, onCleanup) => {
    if (!current) return;
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    const messages = await myApi.getMessages(threadId);
    if (!cancelled) current.setMessages(messages);
  },
  { immediate: true },
);
</script>

<template />
