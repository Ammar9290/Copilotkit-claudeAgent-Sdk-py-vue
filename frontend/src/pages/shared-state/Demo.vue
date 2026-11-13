<script setup lang="ts">
/**
 * Shared State: the page's `src/App.vue` ("Rendering shared state in the UI"),
 * `SharedWorkspace` beside `<CopilotChat agent-id="workspace" />`.
 *
 * The page's runtime-url is `/api/copilotkit`. Here `workspace` is bound on
 * `/api/copilotkit-section-e`, because the page's Python backend is its own
 * Messages API route (`POST /shared-state-read-write`), not an adapter the
 * default endpoint can discover.
 */
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import SharedWorkspace from "./SharedWorkspace.vue";
</script>

<template>
  <DemoFrame parent-path="/shared-state" subtitle="agent: workspace → POST /shared-state-read-write (Messages API loop)">
    <!-- [!code highlight:4] -->
    <CopilotKitProvider runtime-url="/api/copilotkit-section-e" :enable-inspector="INSPECTOR_ENABLED">
      <div class="grid h-full grid-cols-1 md:grid-cols-[22rem_1fr]">
        <div class="min-h-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800"><SharedWorkspace /></div>
        <div class="min-h-0"><CopilotChat agent-id="workspace" /></div>
      </div>
    </CopilotKitProvider>
  </DemoFrame>
</template>
