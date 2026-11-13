<script setup lang="ts">
/**
 * "Inline approval with useInterrupt": `src/components/GovernedActionApproval.vue`
 * as printed, plus styling and an idle line so it is visible that it mounted.
 *
 * It reads `slotProps.value.interrupt.metadata.action`. The Claude adapter only
 * ever emits interrupts for SDK-deferred tools, with metadata
 * `{ source, toolName, input }` — never `action` — and this page publishes no
 * backend that pauses a run. So this panel stays idle here.
 */
import { computed, watchEffect } from "vue";
import { useInterrupt } from "@copilotkit/vue/v2";

type GovernedAction = {
  id: string;
  summary: string;
  tool: string;
  reference: string;
  verdict: "allow" | "deny" | "require_approval";
  arguments: Record<string, unknown>;
};

// [!code highlight:7]
const { slotProps } = useInterrupt({ renderInChat: false });
const action = computed(
  () => slotProps.value?.interrupt?.metadata?.action as
    | GovernedAction
    | undefined,
);

async function approve(approved: boolean) {
  const current = action.value;
  if (!current || !slotProps.value) return;

  await slotProps.value.resolve({
    approved,
    actionId: current.id,
    reference: current.reference,
  });
}

watchEffect(() => {
  if (action.value?.verdict === "allow") void approve(true);
  if (action.value?.verdict === "deny") void slotProps.value?.cancel();
});
</script>

<template>
  <section v-if="action" class="m-3 rounded-lg border p-4 shadow-sm" data-testid="interrupt-approval">
    <p>
      {{
        action.verdict === "allow"
          ? "Allowed by policy"
          : action.verdict === "deny"
            ? "Blocked by policy"
            : "User approval required"
      }}
    </p>
    <h3>{{ action.summary }}</h3>
    <p>Tool: {{ action.tool }}</p>
    <p>Reference: {{ action.reference }}</p>
    <pre>{{ JSON.stringify(action.arguments, null, 2) }}</pre>
    <div v-if="action.verdict === 'require_approval'">
      <button @click="approve(true)">Approve and run</button>
      <button @click="approve(false)">Reject</button>
    </div>
  </section>
  <p v-else class="px-4 py-1 text-xs text-slate-400" data-testid="interrupt-idle">
    useInterrupt panel: idle (no interrupt with metadata.action received)
  </p>
</template>
