<script setup lang="ts">
import { ref, watch } from "vue";
import { languageOf, readSource } from "@/lib/source";
import CodeFigure from "./CodeFigure.vue";

/** Tabs over repo files, read from disk so they can be diffed against the doc's samples. */
const props = defineProps<{ files: string[] }>();
const active = ref(0);
const code = ref<string | null>(null);

watch(
  () => props.files[active.value],
  async (file) => {
    code.value = null;
    if (file) code.value = (await readSource(file)) ?? `// Could not read ${file}`;
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <div v-if="files.length > 1" class="mb-3 flex flex-wrap gap-1.5">
      <button
        v-for="(f, i) in files"
        :key="f"
        type="button"
        :class="[
          'rounded-md border px-2.5 py-1 font-mono text-xs',
          i === active
            ? 'border-[var(--accent)] text-[var(--accent)]'
            : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
        ]"
        @click="active = i"
      >
        {{ f.split("/").pop() }}
      </button>
    </div>
    <CodeFigure v-if="code !== null" :code="code" :caption="files[active]" :language="languageOf(files[active]!)" />
    <p v-else class="text-sm text-slate-500">Loading source…</p>
  </div>
</template>
