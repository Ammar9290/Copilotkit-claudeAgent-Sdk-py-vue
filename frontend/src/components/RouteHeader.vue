<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { md } from "@/lib/md";
import { demoPath, docUrl, findRoute } from "@/lib/nav-config";
import StatusBadge from "./StatusBadge.vue";

/** Every route renders this; it resolves its own metadata so a page can never drift from the nav. */
const props = defineProps<{ path: string }>();
const route = computed(() => findRoute(props.path));
const demo = computed(() => (route.value ? demoPath(route.value) : undefined));
</script>

<template>
  <header v-if="!route" class="border-b border-rose-300 pb-4">
    <p class="text-sm text-rose-700">No nav entry registered for <code>{{ path }}</code>.</p>
  </header>
  <header v-else class="border-b border-slate-200 pb-5 dark:border-slate-800">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{{ route.title }}</h1>
      <StatusBadge :status="route.status" />
      <span
        v-if="route.offNav"
        class="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
      >
        Not in Vue doc sidebar
      </span>
      <span
        v-if="route.reactOnlyDoc"
        class="inline-flex items-center rounded-full border border-violet-300 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200"
      >
        Doc shows React code only
      </span>
    </div>

    <p class="prose-notes mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400" v-html="md(route.summary)" />
    <p v-if="route.statusNote" class="mt-2 max-w-3xl text-sm text-slate-500">{{ route.statusNote }}</p>

    <div class="mt-4 flex flex-wrap items-center gap-3 text-sm">
      <a
        v-if="demo"
        :href="demo"
        target="_blank"
        rel="noreferrer"
        class="rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-white"
      >
        Open demo ↗
      </a>
      <a
        :href="docUrl(route)"
        target="_blank"
        rel="noreferrer"
        class="font-medium text-[var(--accent)] underline underline-offset-4"
      >
        Doc page being tested ↗
      </a>
      <RouterLink to="/status" class="text-slate-500 underline underline-offset-4 hover:text-slate-800 dark:hover:text-slate-200">
        All statuses
      </RouterLink>
    </div>
  </header>
</template>
