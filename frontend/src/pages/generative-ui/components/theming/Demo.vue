<script setup lang="ts">
/**
 * Theming: the Vue tab's provider sample (`:generativeUI="{ ui: standardUI, theme }"`),
 * plus "Colors for each mode" (`dark`), with the theme kept in a `ref` as the
 * page suggests, so the accent buttons restyle live surfaces.
 *
 * Dark mode: the page's index.html script toggles `.dark` on <html> from
 * `prefers-color-scheme`. This demo runs the same script for its lifetime and
 * adds a button to flip the class by hand (handy for recordings).
 */
import { onBeforeUnmount, ref } from "vue";
import { CopilotChat, CopilotKitProvider } from "@copilotkit/vue/v2";
import { standardUI, type GenerativeUITheme } from "@copilotkit/vue/v2/generative-ui";
import DemoFrame from "@/components/DemoFrame.vue";
import { INSPECTOR_ENABLED } from "@/lib/runtime";

const ACCENTS = ["#d97706", "#7c3aed", "#059669"] as const;

// [!code highlight:9]
const theme = ref<GenerativeUITheme>({
  "--a2ui-color-accent": "#d97706",
  "--a2ui-font-family": "Inter, sans-serif",
  "--a2ui-radius-md": "10px",
  dark: {
    "--a2ui-color-panel": "#1f2937",
    "--a2ui-color-surface": "#111827",
  },
});

function setAccent(color: string) {
  theme.value = { ...theme.value, "--a2ui-color-accent": color };
}

// The page's index.html script, scoped to this demo's lifetime.
const root = document.documentElement;
const hadDark = root.classList.contains("dark");
const media = matchMedia("(prefers-color-scheme: dark)");
const isDark = ref(media.matches);
const apply = () => {
  isDark.value = media.matches;
  root.classList.toggle("dark", media.matches);
};
apply();
media.addEventListener("change", apply);
function toggleDark() {
  isDark.value = !isDark.value;
  root.classList.toggle("dark", isDark.value);
}
onBeforeUnmount(() => {
  media.removeEventListener("change", apply);
  root.classList.toggle("dark", hadDark);
});
</script>

<template>
  <DemoFrame parent-path="/generative-ui/components/theming" subtitle="agent: gen-ui-components-theming · theme on the provider">
    <div class="flex h-full flex-col">
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-800">
        <span class="text-slate-500">--a2ui-color-accent</span>
        <button
          v-for="c in ACCENTS"
          :key="c"
          :data-accent="c"
          :class="['h-5 w-5 rounded-full border-2', theme['--a2ui-color-accent'] === c ? 'border-slate-900 dark:border-white' : 'border-transparent']"
          :style="{ background: c }"
          :aria-label="`accent ${c}`"
          @click="setAccent(c)"
        />
        <button class="ml-3 rounded-md border border-slate-300 px-2 py-0.5 dark:border-slate-700" data-testid="toggle-dark" @click="toggleDark">
          {{ isDark ? "dark" : "light" }} mode · switch
        </button>
      </div>
      <div class="min-h-0 flex-1">
        <CopilotKitProvider runtime-url="/api/copilotkit" :generativeUI="{ ui: standardUI, theme }" :enable-inspector="INSPECTOR_ENABLED">
          <CopilotChat agent-id="gen-ui-components-theming" />
        </CopilotKitProvider>
      </div>
    </div>
  </DemoFrame>
</template>
