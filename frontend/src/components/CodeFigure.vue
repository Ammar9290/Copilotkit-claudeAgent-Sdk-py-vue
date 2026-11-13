<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { highlight } from "@/lib/highlight";

/** The one code block in the app — repo files and inline snippets look identical. */
const props = withDefaults(
  defineProps<{ code: string; caption?: string; language?: string; scroll?: "block" | "inline" }>(),
  { scroll: "block" },
);
const html = ref<string | null>(null);

watchEffect(async () => {
  const { code, language } = props;
  html.value = null;
  if (language) html.value = await highlight(code, language);
});
</script>

<template>
  <figure class="code-figure overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
    <figcaption
      v-if="caption || language"
      class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2 font-mono text-xs text-slate-400"
    >
      <span class="min-w-0 break-all">{{ caption }}</span>
      <span v-if="language" class="shrink-0 uppercase">{{ language }}</span>
    </figcaption>
    <div v-if="html" :class="scroll === 'block' ? 'max-h-[36rem] overflow-auto' : 'overflow-x-auto'" v-html="html" />
    <pre
      v-else
      :class="`${scroll === 'block' ? 'max-h-[36rem] overflow-auto' : 'overflow-x-auto'} p-4 text-xs leading-relaxed text-slate-100`"
    ><code>{{ code }}</code></pre>
  </figure>
</template>
