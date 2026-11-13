<script setup lang="ts">
import { onMounted, ref } from "vue";

/**
 * Probes the three processes from the browser. Intelligence and the license
 * get their own rows: they fail independently and are easy to conflate.
 */
interface Health {
  runtime: { ok: boolean; basePaths: string[] };
  agent: { ok: boolean; detail: string; agents?: string[] };
  keys: { anthropic: boolean; openai: boolean; intelligence: boolean; licenseToken: boolean };
}
interface Row {
  ok: boolean;
  neutral?: boolean;
  label: string;
  detail: string;
}

const rows = ref<Row[]>([]);
const agents = ref<string[]>([]);
const loading = ref(false);

async function check() {
  loading.value = true;
  const next: Row[] = [{ ok: true, label: "Vite + Vue app", detail: "Serving this page, so the frontend is up." }];
  try {
    const h = (await (await fetch("/harness/health")).json()) as Health;
    next.push({
      ok: true,
      label: "Copilot Runtime (Node listener)",
      detail: `Base paths: ${h.runtime.basePaths.join(", ")}`,
    });
    next.push({ ok: h.agent.ok, label: "Claude Agent SDK server", detail: h.agent.detail });
    agents.value = h.agent.agents ?? [];
    next.push({
      ok: h.keys.anthropic,
      neutral: !h.keys.anthropic,
      label: "ANTHROPIC_API_KEY",
      detail: h.keys.anthropic
        ? "Set on the backend."
        : "Not set. The Claude Agent SDK falls back to the Claude Code CLI login on this machine; if that is not signed in either, every run fails.",
    });

    let mode = "unknown";
    let licenseStatus = "";
    try {
      const info = await (await fetch("/api/copilotkit-section-a-threads/info")).json();
      mode = info.mode ?? "sse";
      licenseStatus = info.licenseStatus ?? "";
    } catch {
      /* reported below */
    }
    next.push({
      ok: mode === "intelligence",
      neutral: !h.keys.intelligence,
      label: "CopilotKit Intelligence (threads runtime)",
      detail:
        mode === "intelligence"
          ? '/api/copilotkit-section-a-threads/info reports mode "intelligence" — thread list, replay and mutations are live.'
          : h.keys.intelligence
            ? `CPK_INTELLIGENCE_API_KEY is set but /info reports mode "${mode}".`
            : "Not configured — threads fall back to an in-memory runner; the three Threads routes degrade.",
    });
    const licensed = licenseStatus === "valid" || licenseStatus === "expiring";
    next.push({
      ok: licensed,
      neutral: !licensed && !h.keys.licenseToken,
      label: "Feature license (Threads Drawer)",
      detail: licensed
        ? `licenseStatus "${licenseStatus}" — gated UIs are unlocked.`
        : `licenseStatus "${licenseStatus || "not reported"}"${
            h.keys.licenseToken ? "" : " — no COPILOTKIT_LICENSE_TOKEN set"
          }. The drawer shows its locked view.`,
    });
    next.push({
      ok: h.keys.openai,
      neutral: !h.keys.openai,
      label: "OPENAI_API_KEY",
      detail: h.keys.openai ? "Set — the model-router page can run." : "Not set — only “Use any model router” needs it.",
    });
  } catch (error) {
    next.push({
      ok: false,
      label: "Copilot Runtime",
      detail: `Unreachable through /harness/health (${String(error)}). Start it with: cd frontend && npm run dev`,
    });
  }
  rows.value = next;
  loading.value = false;
}

onMounted(check);
</script>

<template>
  <div>
    <ul class="space-y-3">
      <li v-for="r in rows" :key="r.label" class="flex items-start gap-3">
        <span
          :class="`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.neutral ? 'bg-slate-400' : r.ok ? 'bg-emerald-500' : 'bg-rose-500'}`"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ r.label }}</p>
          <p class="break-words text-xs text-slate-500 dark:text-slate-400">{{ r.detail }}</p>
        </div>
      </li>
    </ul>
    <p v-if="agents.length" class="mt-3 text-xs text-slate-500 dark:text-slate-400">
      Registered agents: <code class="break-all">{{ agents.join(", ") }}</code>
    </p>
    <button
      type="button"
      class="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      :disabled="loading"
      @click="check"
    >
      {{ loading ? "Checking…" : "Re-check" }}
    </button>
  </div>
</template>
