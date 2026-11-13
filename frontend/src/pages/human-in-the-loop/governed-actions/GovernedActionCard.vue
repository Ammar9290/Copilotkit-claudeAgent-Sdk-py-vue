<script setup lang="ts">
/**
 * `src/components/GovernedActionCard.vue` as printed. Script unchanged;
 * the template keeps the page's lines and adds styling, a "User approval
 * required" label, the tool/reference/arguments rows the guardrails ask for,
 * and a "Decision sent" line.
 */
import { computed, ref, watchEffect } from "vue";

const props = defineProps<{
  args: {
    id?: string;
    summary?: string;
    reference?: string;
    verdict?: "allow" | "deny" | "require_approval";
  };
  respond?: (result: unknown) => Promise<void>;
}>();

const submitted = ref(false);
const ready = computed(() =>
  Boolean(props.respond && props.args.id && props.args.reference && props.args.verdict),
);

function submitDecision(approved: boolean) {
  if (!ready.value || submitted.value || !props.respond) return;
  if (approved && props.args.verdict === "deny") return;
  submitted.value = true;
  void props.respond({
    approved,
    actionId: props.args.id,
    reference: props.args.reference,
  });
}

watchEffect(() => {
  if (props.args.verdict === "allow") submitDecision(true);
  if (props.args.verdict === "deny") submitDecision(false);
});

// Display only (NOT DOC CODE): the page's props type omits these two fields.
const extra = computed(() => props.args as { tool?: string; arguments?: Record<string, unknown> });
</script>

<template>
  <section
    class="my-2 max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40"
    data-testid="governed-card"
    :data-verdict="props.args.verdict"
  >
    <p v-if="props.args.verdict === 'allow'" class="font-semibold text-emerald-700" data-testid="governed-allow">Allowed by policy</p>
    <p v-else-if="props.args.verdict === 'deny'" class="font-semibold text-rose-700" data-testid="governed-deny">Blocked by policy</p>
    <p v-else-if="props.args.verdict" class="font-semibold">User approval required</p>
    <p class="mt-1">{{ props.args.summary ?? "Preparing approval…" }}</p>
    <p v-if="extra.tool" class="mt-1 text-xs">
      Tool: <code>{{ extra.tool }}</code> · Reference: <code>{{ props.args.reference }}</code>
    </p>
    <pre v-if="extra.arguments" class="mt-2 whitespace-pre-wrap rounded bg-white/70 p-2 text-xs dark:bg-slate-900">{{
      JSON.stringify(extra.arguments, null, 2)
    }}</pre>
    <div v-if="ready && !submitted && props.args.verdict === 'require_approval'" class="mt-3 flex gap-2">
      <button class="rounded-md bg-emerald-600 px-3 py-1 text-white" data-testid="governed-approve" @click="submitDecision(true)">
        Approve and run
      </button>
      <button class="rounded-md border border-slate-300 px-3 py-1" data-testid="governed-reject" @click="submitDecision(false)">
        Reject
      </button>
    </div>
    <p v-if="submitted" class="mt-2 text-xs text-slate-500" data-testid="governed-submitted">Decision sent.</p>
  </section>
</template>
