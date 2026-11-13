<script setup lang="ts">
import { computed } from "vue";
import BackendHealth from "@/components/BackendHealth.vue";
import Callout from "@/components/Callout.vue";
import Panel from "@/components/Panel.vue";
import RouteHeader from "@/components/RouteHeader.vue";
import SourceCode from "@/components/SourceCode.vue";
import TryIt from "@/components/TryIt.vue";
import { findRoute } from "@/lib/nav-config";

/**
 * The notes page every doc route gets: header, what it demonstrates, how to
 * judge pass/fail, any discrepancy notes, and the repo source behind the demo.
 * All content comes from nav-config.ts so it cannot drift from the status table.
 */
const props = defineProps<{ path: string; showHealth?: boolean }>();
const route = computed(() => findRoute(props.path));
</script>

<template>
  <RouteHeader :path="path" />

  <template v-if="route">
    <Panel v-if="route.tryIt" title="What to test">
      <TryIt v-bind="route.tryIt" />
      <p v-if="route.agentId" class="mt-3 text-xs text-slate-500">
        Agent <code>{{ route.agentId }}</code> via runtime <code>{{ route.runtimePath }}</code>
      </p>
    </Panel>

    <Panel v-if="showHealth" title="Connection check" description="Probed from the browser on load.">
      <BackendHealth />
    </Panel>

    <Panel v-if="route.notes?.length" title="Notes">
      <div class="space-y-3">
        <Callout v-for="n in route.notes" :key="n.title" :tone="n.tone ?? 'info'" :title="n.title">
          <span v-html="n.html" />
        </Callout>
      </div>
    </Panel>

    <Panel v-if="route.status === 'not-available'" title="Why there is no demo">
      <Callout tone="warn" :title="route.statusNote ?? 'Not available'">
        This route exists so the gap is visible in the nav and the status table. Nothing here was guessed from another
        framework's version of the page.
      </Callout>
      <slot name="extra" />
    </Panel>

    <slot />

    <Panel v-if="route.sources?.length" title="The demo's source" description="Read from this repo at build time.">
      <SourceCode :files="route.sources" />
    </Panel>
  </template>
</template>
