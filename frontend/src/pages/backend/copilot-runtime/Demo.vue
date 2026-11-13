<script setup lang="ts">
/**
 * Copilot Runtime — three surfaces from the page, one at a time:
 *
 *  1. "Setting up the runtime" + "The default agent": `CopilotKitProvider
 *     runtime-url="/api/copilotkit-section-f-runtime"` and a `<CopilotChat />`
 *     with NO agent-id. The runtime registered the Python agent under the key
 *     `default`, so the chat picks it up.
 *  2. "Connecting to an AG-UI agent directly": the page's `src/App.vue` —
 *     `HttpAgent` + `:agents__unsafe_dev_only`, no runtime at all. The URL goes
 *     through Vite's `/agent` proxy to the Python server.
 *  3. "Forwarding request headers to your agent": the provider sends extra
 *     headers; the runtime's `forwardHeaders` policy decides which reach the
 *     agent. The header-echo debug endpoint replies with what arrived.
 *
 * Each mode shows the raw AG-UI events beside the chat.
 */
import { computed, ref } from "vue";
import { HttpAgent } from "@ag-ui/client";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RawEvents from "../RawEvents.vue";

type Mode = "runtime" | "direct" | "headers";
const mode = ref<Mode>("runtime");

// [!code highlight:3]
const myAgent = new HttpAgent({
  url: "/agent/section-f-copilot-runtime",
});

/** Headers chosen to hit each rule of the page's forwarding policy. */
const FORWARD_TEST_HEADERS = {
  Authorization: "Bearer demo-token",
  "x-tenant-id": "from-the-browser",
  "x-internal-debug": "should-be-denied (deny)",
  "x-acme-trace": "should-be-denied (denyPrefixes)",
  "x-request-id": "should-be-denied (default denylist)",
};
const echoAgent = ref<"header-echo" | "header-echo-server">("header-echo");

const subtitle = computed(
  () =>
    ({
      runtime: "runtime-url=/api/copilotkit-section-f-runtime · <CopilotChat /> with no agent-id → key 'default'",
      direct: "agents__unsafe_dev_only · HttpAgent → /agent/section-f-copilot-runtime · no runtime",
      headers: "forwardHeaders { deny, denyPrefixes } · header-echo debug endpoint",
    })[mode.value],
);
</script>

<template>
  <DemoFrame parent-path="/backend/copilot-runtime" :subtitle="subtitle">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <button
          v-for="m in ['runtime', 'direct', 'headers'] as Mode[]"
          :key="m"
          :data-testid="`mode-${m}`"
          :class="[
            'rounded-md px-2 py-1',
            mode === m ? 'bg-[var(--accent)] text-white' : 'border border-slate-300 dark:border-slate-700',
          ]"
          @click="mode = m"
        >
          {{ m === "runtime" ? "Through the runtime (default agent)" : m === "direct" ? "Direct AG-UI connection" : "Header forwarding" }}
        </button>
        <template v-if="mode === 'headers'">
          <span class="ml-2 text-slate-500">agent:</span>
          <select v-model="echoAgent" data-testid="echo-agent" class="rounded border border-slate-300 bg-transparent px-1 py-0.5 dark:border-slate-700">
            <option value="header-echo">header-echo (no server headers)</option>
            <option value="header-echo-server">header-echo-server (HttpAgent sets X-Tenant-Id)</option>
          </select>
        </template>
      </div>

      <div class="min-h-0 flex-1">
        <!-- 1. Through the runtime -->
        <CopilotKitProvider
          v-if="mode === 'runtime'"
          key="runtime"
          runtime-url="/api/copilotkit-section-f-runtime"
          :enable-inspector="INSPECTOR_ENABLED"
        >
          <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
            <div class="min-h-0"><CopilotChat /></div>
            <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><RawEvents title="Raw AG-UI events (via runtime)" /></div>
          </div>
        </CopilotKitProvider>

        <!-- 2. Direct connection, the page's src/App.vue -->
        <!-- [!code highlight:2] -->
        <CopilotKitProvider
          v-else-if="mode === 'direct'"
          key="direct"
          :agents__unsafe_dev_only="{ 'my-agent': myAgent }"
          :enable-inspector="INSPECTOR_ENABLED"
        >
          <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
            <div class="min-h-0"><CopilotChat agent-id="my-agent" /></div>
            <div class="min-h-0 border-l border-slate-200 dark:border-slate-800">
              <RawEvents agent-id="my-agent" title="Raw AG-UI events (direct)" />
            </div>
          </div>
        </CopilotKitProvider>

        <!-- 3. Header forwarding -->
        <CopilotKitProvider
          v-else
          :key="`headers-${echoAgent}`"
          runtime-url="/api/copilotkit-section-f-runtime"
          :headers="FORWARD_TEST_HEADERS"
          :enable-inspector="INSPECTOR_ENABLED"
        >
          <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
            <div class="flex min-h-0 flex-col">
              <pre class="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] dark:border-slate-800 dark:bg-slate-900" data-testid="sent-headers">Browser sends: {{ JSON.stringify(FORWARD_TEST_HEADERS, null, 1) }}</pre>
              <div class="min-h-0 flex-1"><CopilotChat :agent-id="echoAgent" /></div>
            </div>
            <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><RawEvents :agent-id="echoAgent" /></div>
          </div>
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
