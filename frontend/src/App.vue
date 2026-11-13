<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import NavSidebar from "./components/NavSidebar.vue";

/**
 * `/…/demo-chat` routes render full-bleed with no sidebar, so they can be
 * screen-recorded without the harness chrome. Everything else gets the
 * sidebar layout.
 *
 * Unlike the React sibling there is no app-wide provider: every demo mounts its
 * own `CopilotKitProvider`, the way each Vue doc page's `App.vue` sample does,
 * because several pages need provider props (`:generativeUI`, `:a2ui`,
 * `:headers`…) or a runtime of their own.
 */
const route = useRoute();
const isDemo = computed(() => route.path.endsWith("/demo-chat"));
</script>

<template>
  <div v-if="isDemo" class="h-dvh overflow-hidden">
    <RouterView />
  </div>
  <template v-else>
    <NavSidebar />
    <main class="lg:pl-72">
      <div class="mx-auto max-w-5xl space-y-6 px-5 py-10 lg:px-8">
        <RouterView :key="route.path" />
      </div>
    </main>
  </template>
</template>
