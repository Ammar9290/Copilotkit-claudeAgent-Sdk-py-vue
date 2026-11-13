<script setup lang="ts">
/**
 * State Streaming — the page's `src/App.vue`: `<StreamingDocument />` and
 * `<CopilotChat agent-id="writer" />` under one provider.
 *
 * NOT DOC CODE (one line): `writer` is registered as a local `HttpAgent`
 * through `agents__unsafe_dev_only`. The page's backend is a raw Anthropic
 * stream loop, mounted with `register(app)` at `POST /shared-state-streaming`,
 * so it is not in the backend's `/health` list and `/api/copilotkit` never
 * learns about it. The URL goes through Vite's `/agent` proxy. `runtime-url`
 * stays as the page has it.
 *
 * Also added: a raw AG-UI event panel, so the RUN_ERROR is visible.
 */
import { HttpAgent } from "@ag-ui/client";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RawEvents from "../../backend/RawEvents.vue";
import StreamingDocument from "./StreamingDocument.vue";

// NOT DOC CODE — see above.
const writer = new HttpAgent({ url: "/agent/shared-state-streaming" });
</script>

<template>
  <DemoFrame
    parent-path="/shared-state/streaming"
    subtitle="agent: writer → POST /shared-state-streaming (raw Anthropic stream loop)"
  >
    <!-- [!code highlight:9] -->
    <CopilotKitProvider
      runtime-url="/api/copilotkit"
      :agents__unsafe_dev_only="{ writer }"
      :enable-inspector="INSPECTOR_ENABLED"
    >
      <div class="grid h-full grid-cols-1 md:grid-cols-[1fr_26rem]">
        <div class="flex min-h-0 flex-col">
          <div class="max-h-[60%] shrink-0 overflow-y-auto border-b border-slate-200 dark:border-slate-800"><StreamingDocument /></div>
          <div class="min-h-0 flex-1"><RawEvents agent-id="writer" title="Raw AG-UI events" /></div>
        </div>
        <div class="min-h-0 border-l border-slate-200 dark:border-slate-800"><CopilotChat agent-id="writer" /></div>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
