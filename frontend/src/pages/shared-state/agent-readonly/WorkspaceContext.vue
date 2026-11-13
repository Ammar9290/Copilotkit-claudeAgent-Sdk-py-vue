<script setup lang="ts">
/**
 * `src/components/WorkspaceContext.vue` from Agent Read-Only Context. The
 * script is the page's; a `<select>` bound to the same ref was added so the
 * value can change ("Wire it to your own state").
 */
import { ref } from "vue";
import { useAgentContext } from "@copilotkit/vue/v2";

const workspaceId = ref("northstar");

// [!code highlight:4]
useAgentContext({
  description: "Active workspace",
  value: workspaceId,
});
</script>

<template>
  <div class="flex items-center gap-3 border-b border-slate-200 py-2 pl-4 pr-20 text-sm dark:border-slate-800">
    <p>Workspace: <strong data-testid="workspace">{{ workspaceId }}</strong></p>
    <label class="text-xs text-slate-500">
      switch
      <select
        v-model="workspaceId"
        aria-label="Workspace"
        data-testid="workspace-select"
        class="ml-1 rounded border border-slate-300 px-1 py-0.5 dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="northstar">northstar</option>
        <option value="aurora">aurora</option>
        <option value="tidewater">tidewater</option>
      </select>
    </label>
    <span class="ml-auto text-xs text-slate-400">read-only to the agent</span>
  </div>
</template>
