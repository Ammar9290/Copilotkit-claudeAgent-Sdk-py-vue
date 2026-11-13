<script setup lang="ts">
/**
 * Prebuilt Components — the three surfaces, one per tab, on one agent.
 *
 *   - CopilotChat:    the page's drop-in `CopilotChat agent-id=…`, plus the
 *                     feedback slot from "Open, close, and feedback".
 *   - CopilotSidebar: `:default-open`, `width`, and a custom `toggle-button`
 *                     scoped slot (isOpen / toggle) from the chat-controls page.
 *   - CopilotPopup:   `width` / `height` / `click-outside-to-close`, and the
 *                     chat-controls page's `toggle-button` sample.
 *
 * `useConfigureSuggestions` lives in Suggestions.vue, a child of the provider.
 */
import { ref } from "vue";
import { CopilotKitProvider, CopilotPopup, CopilotSidebar } from "@copilotkit/vue/v2";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";
import ChatWithFeedback from "./ChatWithFeedback.vue";
import Suggestions from "./Suggestions.vue";

const tabs = ["CopilotChat", "CopilotSidebar", "CopilotPopup"] as const;
const tab = ref<(typeof tabs)[number]>("CopilotChat");
</script>

<template>
  <DemoFrame parent-path="/prebuilt-components" subtitle="agent: prebuilt-components">
    <CopilotKitProvider runtime-url="/api/copilotkit" :enable-inspector="INSPECTOR_ENABLED">
      <Suggestions>
        <div class="flex h-full flex-col">
          <div class="flex gap-1 border-b border-slate-200 px-4 py-2 dark:border-slate-800" role="tablist">
            <button
              v-for="t in tabs"
              :key="t"
              type="button"
              role="tab"
              :data-tab="t"
              :aria-selected="tab === t"
              :class="[
                'rounded-md px-3 py-1 font-mono text-xs',
                tab === t
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              ]"
              @click="tab = t"
            >
              {{ t }}
            </button>
          </div>

          <div class="relative min-h-0 flex-1">
            <ChatWithFeedback v-if="tab === 'CopilotChat'" />

            <main v-else-if="tab === 'CopilotSidebar'" class="h-full overflow-y-auto p-10">
              <h2 class="text-xl font-semibold">Your app</h2>
              <p class="mt-2 max-w-prose text-sm text-slate-600 dark:text-slate-400">
                A docked surface that starts open. Close it from its header and reopen it with the launcher below,
                which is a custom <code>#toggle-button</code> slot.
              </p>
              <!-- [!code highlight:10] -->
              <CopilotSidebar agent-id="prebuilt-components" :default-open="true" :width="420">
                <template #toggle-button="{ isOpen, toggle }">
                  <button
                    type="button"
                    class="custom-launcher fixed bottom-6 left-6 z-50 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
                    @click="toggle"
                  >
                    {{ isOpen ? "Close sidebar" : "Open sidebar" }}
                  </button>
                </template>
              </CopilotSidebar>
            </main>

            <main v-else class="h-full overflow-y-auto p-10">
              <h2 class="text-xl font-semibold">Your app</h2>
              <p class="mt-2 max-w-prose text-sm text-slate-600 dark:text-slate-400">
                A floating launcher opens an overlay chat. The launcher is the chat-controls page's
                <code>#toggle-button</code> sample; clicking outside the window closes it.
              </p>
              <!-- [!code highlight:15] -->
              <CopilotPopup
                agent-id="prebuilt-components"
                :default-open="false"
                :width="420"
                :height="560"
                :click-outside-to-close="true"
              >
                <template #toggle-button="{ isOpen, toggle }">
                  <button
                    type="button"
                    class="custom-launcher fixed bottom-6 left-6 z-50 rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white shadow-lg"
                    @click="toggle"
                  >
                    {{ isOpen ? "Close chat" : "Ask the assistant" }}
                  </button>
                </template>
              </CopilotPopup>
            </main>
          </div>
        </div>
      </Suggestions>
    </CopilotKitProvider>
  </DemoFrame>
</template>
