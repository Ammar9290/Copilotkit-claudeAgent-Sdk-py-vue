<script setup lang="ts">
/**
 * Inspector — "appears by default in development builds" of Vue apps. The
 * page's only code sample is React (`enableInspector={false}`); its text gives
 * the Vue form, `:enable-inspector="false"`, which the checkbox below drives.
 *
 * This demo ignores VITE_COPILOTKIT_INSPECTOR on purpose: the overlay is the
 * subject here. The provider is remounted (`:key`) when the box changes, so
 * the prop is applied from setup.
 */
import { ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";

const enabled = ref(true);
</script>

<template>
  <DemoFrame parent-path="/inspector" subtitle="agent: inspector">
    <div class="flex h-full flex-col">
      <label class="flex items-center gap-2 border-b border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
        <input v-model="enabled" type="checkbox" data-testid="inspector-toggle" />
        <code>:enable-inspector="{{ enabled }}"</code>
        <span class="text-xs text-slate-500">· the launcher is the floating CopilotKit button</span>
      </label>
      <div class="min-h-0 flex-1">
        <!-- [!code highlight:3] -->
        <CopilotKitProvider :key="String(enabled)" runtime-url="/api/copilotkit" :enable-inspector="enabled">
          <CopilotChat agent-id="inspector" />
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
