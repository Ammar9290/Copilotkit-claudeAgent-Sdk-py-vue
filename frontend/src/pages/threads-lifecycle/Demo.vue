<script setup lang="ts">
/**
 * Thread & History Lifecycle — mint → run → switch/start → hydrate, with the
 * live threadId on screen.
 *
 * Runtime: the default `/api/copilotkit`. The lifecycle mechanics on this page
 * are client-side and work against any runtime; server-side replay needs "a
 * server-side store such as CopilotKit Intelligence or a persisting
 * AgentRunner". The stock CopilotRuntime's runner is `InMemoryAgentRunner`, so
 * replay is from process memory (lost when the runtime restarts). The page's
 * Intelligence + `identifyUser` runtime lives in
 * runtime/endpoints/section-a-threads.ts, and cannot be built here (no key).
 */
import { ref } from "vue";
import { CopilotChat, CopilotChatConfigurationProvider, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import RestoreHistory from "./RestoreHistory.vue";
import ThreadControls from "./ThreadControls.vue";

const hydrate = ref(false);
</script>

<template>
  <DemoFrame parent-path="/threads-lifecycle" subtitle="agent: threads-lifecycle · /api/copilotkit">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <CopilotChatConfigurationProvider agent-id="threads-lifecycle">
        <div class="flex h-full flex-col">
          <ThreadControls />
          <label class="flex items-center gap-2 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <input v-model="hydrate" type="checkbox" data-testid="manual-hydrate" />
            Hydrate manually with <code>setMessages</code> (RestoreHistory.vue)
          </label>
          <RestoreHistory v-if="hydrate" thread-id="manual-demo" />
          <div class="min-h-0 flex-1"><CopilotChat /></div>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
