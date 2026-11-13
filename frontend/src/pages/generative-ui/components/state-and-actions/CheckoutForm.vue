<script setup lang="ts">
/** `src/components/CheckoutForm.vue` from State and actions › Keep what the user types (Vue tab), plus classes and a data-testid. */
const email = defineModel<string>("email");
</script>

<template>
  <label class="flex flex-col gap-1 text-xs" data-testid="checkout-form">
    <span class="font-medium">Email</span>
    <input v-model="email" class="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900" data-testid="checkout-email" />
  </label>
</template>
