<script setup lang="ts">
import { RouterLink } from "vue-router";
import BackendHealth from "@/components/BackendHealth.vue";
import Panel from "@/components/Panel.vue";
import RouteHeader from "@/components/RouteHeader.vue";
import { NAV } from "@/lib/nav-config";
</script>

<template>
  <RouteHeader path="/" />

  <Panel title="What this is">
    <p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      A test harness you can click through, for CopilotKit's <strong>Vue</strong> frontend (<code>@copilotkit/vue/v2</code>) running on
      a <strong>Claude Agent SDK (Python)</strong> backend. Each page under
      <code>docs.copilotkit.ai/vue/claude-sdk-python</code> that we cover has a route here. Each route has either a
      working demo built from that page's Vue samples or a status that says why it doesn't work. Broken pages are
      left broken and marked that way. They have not been patched to look like they work.
    </p>
  </Panel>

  <Panel title="Architecture" description="Three processes, matching the Vue Quickstart's shape.">
    <ol class="list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
      <li><strong>Vite + Vue</strong> (:5273) — this app. Each demo mounts its own <code>CopilotKitProvider</code>.</li>
      <li>
        <strong>Copilot Runtime</strong> (:8300), <code>frontend/server.ts</code>. It runs
        <code>createCopilotNodeListener({ cors: true })</code> and serves one base path for each runtime configuration a
        doc page asks for (<code>frontend/runtime/endpoints/</code>).
      </li>
      <li>
        <strong>Claude Agent SDK (Python) server</strong> (:8100), <code>backend/src/agent_server.py</code>. It runs
        FastAPI with one <code>ClaudeAgentAdapter</code> per route, serves each one over AG-UI, and the runtime reaches it
        with <code>HttpAgent</code>.
      </li>
    </ol>
  </Panel>

  <Panel title="Connection check"><BackendHealth /></Panel>

  <Panel title="Sections">
    <div class="grid gap-4 sm:grid-cols-2">
      <div v-for="g in NAV" :key="g.title">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ g.title }}</p>
        <ul class="mt-1 space-y-0.5 text-sm">
          <li v-for="r in g.routes" :key="r.path">
            <RouterLink :to="r.path" class="text-slate-700 underline-offset-4 hover:underline dark:text-slate-300">{{ r.title }}</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </Panel>
</template>
