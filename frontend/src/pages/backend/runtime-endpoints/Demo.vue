<script setup lang="ts">
/**
 * Runtime HTTP endpoints — the page's route tables, called from the browser.
 *
 * Left: one button per route of the multi-route runtime at
 * `/api/copilotkit-section-f-runtime` (plus the single-route mount at
 * `/api/copilotkit-section-f-single`). "POST /agent/:agentId/run" sends a real
 * `RunAgentInput` to the Python agent and renders the SSE response as raw AG-UI
 * events; the thread routes then read the thread that run created.
 *
 * Right: a `CopilotChat` on the single-route mount with `use-single-endpoint`
 * omitted, so the Vue provider has to discover the transport from runtime info,
 * as the page's single-route section says it does.
 */
import { computed, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";

const BASE = "/api/copilotkit-section-f-runtime";
const SINGLE = "/api/copilotkit-section-f-single";
const AGENT = "runtime-endpoints";

const threadId = ref(`probe-${crypto.randomUUID().slice(0, 8)}`);
const prompt = ref("Name three planets in one short sentence.");

const runInput = (runId: string, messages: unknown[]) => ({
  threadId: threadId.value,
  runId,
  messages,
  tools: [],
  context: [],
  state: {},
  forwardedProps: {},
});

interface Probe {
  id: string;
  group: string;
  label: string;
  method: "GET" | "POST";
  url: () => string;
  body?: () => unknown;
}

const PROBES: Probe[] = [
  { id: "info", group: "Discovery", label: "Runtime info", method: "GET", url: () => `${BASE}/info` },
  {
    id: "run",
    group: "Agent",
    label: "Start a run (SSE of AG-UI events)",
    method: "POST",
    url: () => `${BASE}/agent/${AGENT}/run`,
    body: () => runInput(crypto.randomUUID(), [{ id: crypto.randomUUID(), role: "user", content: prompt.value }]),
  },
  {
    id: "connect",
    group: "Agent",
    label: "Connect to this thread (replays its events)",
    method: "POST",
    url: () => `${BASE}/agent/${AGENT}/connect`,
    body: () => runInput(crypto.randomUUID(), []),
  },
  {
    id: "connect-unknown",
    group: "Agent",
    label: "Connect to an unregistered agent id",
    method: "POST",
    url: () => `${BASE}/agent/not-registered/connect`,
    body: () => runInput(crypto.randomUUID(), []),
  },
  { id: "stop", group: "Agent", label: "Stop this thread's run", method: "POST", url: () => `${BASE}/agent/${AGENT}/stop/${threadId.value}` },
  {
    id: "stop-bad",
    group: "Agent",
    label: "Stop with an invalid body",
    method: "POST",
    url: () => `${BASE}/agent/${AGENT}/stop/${threadId.value}`,
    body: () => ({ notRunId: 1 }),
  },
  { id: "threads", group: "Threads", label: "List threads", method: "GET", url: () => `${BASE}/threads?agentId=${AGENT}` },
  { id: "messages", group: "Threads", label: "This thread's messages", method: "GET", url: () => `${BASE}/threads/${threadId.value}/messages` },
  { id: "events", group: "Threads", label: "This thread's compacted events", method: "GET", url: () => `${BASE}/threads/${threadId.value}/events` },
  { id: "state", group: "Threads", label: "This thread's state", method: "GET", url: () => `${BASE}/threads/${threadId.value}/state` },
  { id: "clear", group: "Threads", label: "Clear in-memory threads", method: "POST", url: () => `${BASE}/threads/clear` },
  { id: "inspector", group: "Other", label: "Inspector metadata", method: "GET", url: () => `${BASE}/inspector-metadata` },
  { id: "transcribe", group: "Other", label: "Transcribe (no audio service)", method: "POST", url: () => `${BASE}/transcribe` },
  {
    id: "single-info",
    group: "Single-route",
    label: 'Envelope {"method":"info"}',
    method: "POST",
    url: () => SINGLE,
    body: () => ({ method: "info" }),
  },
  { id: "single-get-info", group: "Single-route", label: "GET /info on the single-route mount", method: "GET", url: () => `${SINGLE}/info` },
];

interface Result {
  status: number | string;
  contentType: string;
  body: string;
  events?: { type: string; json: string }[];
  ms: number;
}
const results = ref<Record<string, Result>>({});
const busy = ref<string | null>(null);

function parseSse(text: string) {
  return text
    .split(/\n\n/)
    .map((block) => block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join(""))
    .filter(Boolean)
    .map((data) => {
      try {
        const ev = JSON.parse(data) as { type?: string };
        return { type: String(ev.type), json: JSON.stringify(ev, null, 2) };
      } catch {
        return { type: "(unparsed)", json: data };
      }
    });
}

async function run(p: Probe) {
  busy.value = p.id;
  const started = performance.now();
  const body = p.body?.();
  try {
    const res = await fetch(p.url(), {
      method: p.method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    let pretty = text;
    try {
      pretty = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* not JSON */
    }
    results.value[p.id] = {
      status: res.status,
      contentType,
      body: pretty.slice(0, 20000),
      events: contentType.includes("text/event-stream") ? parseSse(text) : undefined,
      ms: Math.round(performance.now() - started),
    };
  } catch (error) {
    results.value[p.id] = { status: "network error", contentType: "", body: String(error), ms: 0 };
  } finally {
    busy.value = null;
  }
}

const groups = computed(() => [...new Set(PROBES.map((p) => p.group))]);
const openEvent = ref<string | null>(null);
</script>

<template>
  <DemoFrame parent-path="/backend/runtime-endpoints" subtitle="raw HTTP against /api/copilotkit-section-f-runtime (+ single-route mount)">
    <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_24rem]">
      <div class="min-h-0 space-y-4 overflow-y-auto p-4">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <label>threadId <input v-model="threadId" data-testid="thread-id" class="w-44 rounded border border-slate-300 bg-transparent px-1 py-0.5 font-mono dark:border-slate-700" /></label>
          <label class="flex flex-1 items-center gap-1">prompt <input v-model="prompt" data-testid="run-prompt" class="flex-1 rounded border border-slate-300 bg-transparent px-1 py-0.5 dark:border-slate-700" /></label>
        </div>

        <section v-for="g in groups" :key="g">
          <h2 class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ g }}</h2>
          <div class="space-y-2">
            <div
              v-for="p in PROBES.filter((x) => x.group === g)"
              :key="p.id"
              class="rounded-lg border border-slate-200 dark:border-slate-800"
              :data-testid="`probe-${p.id}`"
            >
              <div class="flex items-center justify-between gap-3 px-3 py-1.5">
                <div class="min-w-0">
                  <code class="block truncate text-xs">{{ p.method }} {{ p.url() }}</code>
                  <span class="text-[11px] text-slate-500">{{ p.label }}</span>
                </div>
                <button
                  class="shrink-0 rounded-md bg-[var(--accent)] px-3 py-1 text-xs text-white disabled:opacity-50"
                  :disabled="busy === p.id"
                  :data-testid="`run-${p.id}`"
                  @click="run(p)"
                >
                  {{ busy === p.id ? "…" : "Send" }}
                </button>
              </div>
              <div v-if="results[p.id]" class="border-t border-slate-200 dark:border-slate-800">
                <p class="px-3 py-1 text-xs">
                  HTTP <strong data-testid="probe-status">{{ results[p.id]!.status }}</strong>
                  <span class="text-slate-500"> · {{ results[p.id]!.contentType || "no body" }} · {{ results[p.id]!.ms }} ms</span>
                </p>
                <ol v-if="results[p.id]!.events" class="max-h-80 overflow-y-auto bg-slate-950 p-2 font-mono text-[11px] text-slate-200" data-testid="sse-events">
                  <li v-for="(e, i) in results[p.id]!.events" :key="i" :data-event-type="e.type">
                    <button class="w-full truncate text-left" @click="openEvent = openEvent === `${p.id}-${i}` ? null : `${p.id}-${i}`">
                      <span :class="e.type === 'RUN_ERROR' ? 'text-red-400' : 'text-emerald-400'">{{ e.type }}</span>
                      <span class="text-slate-400"> {{ e.json.replace(/\s+/g, " ").slice(0, 160) }}</span>
                    </button>
                    <pre v-if="openEvent === `${p.id}-${i}`" class="whitespace-pre-wrap text-slate-300">{{ e.json }}</pre>
                  </li>
                </ol>
                <pre v-else class="max-h-64 overflow-auto bg-slate-950 p-3 text-[11px] text-slate-200">{{ results[p.id]!.body || "(empty body)" }}</pre>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="flex min-h-0 flex-col border-l border-slate-200 dark:border-slate-800">
        <p class="shrink-0 border-b border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-800">
          Chat on the <strong>single-route</strong> mount, <code>use-single-endpoint</code> omitted (transport discovered).
        </p>
        <div class="min-h-0 flex-1">
          <!-- [!code highlight:3] -->
          <CopilotKitProvider runtime-url="/api/copilotkit-section-f-single" :enable-inspector="INSPECTOR_ENABLED">
            <CopilotChat agent-id="runtime-endpoints" />
          </CopilotKitProvider>
        </div>
      </div>
    </div>
  </DemoFrame>
</template>
