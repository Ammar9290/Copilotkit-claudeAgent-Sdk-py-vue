<script setup lang="ts">
/**
 * Threads Drawer — the page's "src/App.vue with a toolbar button". Differences:
 *   - runtime path: this section's Intelligence runtime
 *     (runtime/endpoints/section-a-threads.ts), the setup the page requires;
 *   - agent id;
 *   - `public-license-key` reads VITE_COPILOTKIT_PUBLIC_LICENSE_KEY instead of
 *     the page's "ck_pub_..." placeholder. No key is configured here, so it is
 *     undefined and the drawer behaves as unlicensed. Left as-is.
 * The thread id under the toolbar is the active configuration's, shown so a
 * recording can prove "New conversation" changed it.
 */
import { defineComponent, h } from "vue";
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
  CopilotThreadsDrawer,
  useCopilotChatConfiguration,
} from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import NewConversationButton from "./NewConversationButton.vue";

const publicLicenseKey = import.meta.env.VITE_COPILOTKIT_PUBLIC_LICENSE_KEY as string | undefined;

const ActiveThreadId = defineComponent(() => {
  const config = useCopilotChatConfiguration();
  return () => h("code", { class: "text-[11px] text-slate-500", "data-testid": "thread-id" }, config.value?.threadId ?? "");
});
</script>

<template>
  <DemoFrame
    parent-path="/prebuilt-components/copilot-threads-drawer"
    subtitle="agent: copilot-threads-drawer · /api/copilotkit-section-a-threads"
  >
    <!-- [!code highlight:4] -->
    <CopilotKitProvider
      runtime-url="/api/copilotkit-section-a-threads"
      :public-license-key="publicLicenseKey"
      :enable-inspector="INSPECTOR_ENABLED"
    >
      <!-- [!code highlight:9] -->
      <CopilotChatConfigurationProvider agent-id="copilot-threads-drawer">
        <div style="display: flex; height: 100%">
          <CopilotThreadsDrawer />
          <main style="flex: 1; display: flex; flex-direction: column; min-width: 0">
            <header class="flex items-center gap-3 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
              <NewConversationButton />
              <ActiveThreadId />
            </header>
            <div class="min-h-0 flex-1"><CopilotChat /></div>
          </main>
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  </DemoFrame>
</template>
