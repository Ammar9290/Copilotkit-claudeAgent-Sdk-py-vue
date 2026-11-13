<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { NAV, type RouteStatus } from "@/lib/nav-config";

const route = useRoute();
const open = ref(false);

const DOT: Record<RouteStatus, string> = {
  working: "bg-emerald-500",
  partial: "bg-amber-500",
  reference: "bg-slate-400",
  broken: "bg-rose-500",
  "not-started": "border border-slate-300 bg-transparent dark:border-slate-600",
  "not-available": "bg-slate-300 dark:bg-slate-600",
};
</script>

<template>
  <button
    type="button"
    class="fixed left-3 top-3 z-50 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-900"
    :aria-expanded="open"
    @click="open = !open"
  >
    {{ open ? "Close" : "Menu" }}
  </button>

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div class="h-12 lg:h-0" />
    <nav class="space-y-6 p-4">
      <div>
        <RouterLink to="/" class="block text-sm font-semibold text-slate-900 dark:text-slate-100" @click="open = false">
          CopilotKit + Claude SDK · Vue
        </RouterLink>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Test harness</p>
        <RouterLink
          to="/status"
          :class="[
            'mt-3 inline-block rounded-md border px-2.5 py-1 text-xs font-medium',
            route.path === '/status'
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300',
          ]"
          @click="open = false"
        >
          Status overview
        </RouterLink>
      </div>

      <div v-for="group in NAV" :key="group.title">
        <p class="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {{ group.title }}
        </p>
        <ul class="mt-1.5 space-y-0.5">
          <li v-for="item in group.routes" :key="item.path">
            <RouterLink
              :to="item.path"
              :class="[
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                route.path === item.path
                  ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
              ]"
              @click="open = false"
            >
              <span :class="`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[item.status]}`" aria-hidden="true" />
              <span class="min-w-0 truncate">{{ item.title }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>

  <button
    v-if="open"
    type="button"
    aria-label="Close navigation"
    class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
    @click="open = false"
  />
</template>
