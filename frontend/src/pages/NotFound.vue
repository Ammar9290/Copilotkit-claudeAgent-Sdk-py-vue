<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div class="space-y-3">
    <h1 class="text-2xl font-semibold">Not found</h1>
    <p class="text-sm text-slate-600 dark:text-slate-400">No route here. Try the <RouterLink to="/status" class="text-[var(--accent)] underline">status overview</RouterLink>.</p>
  </div>
</template>
