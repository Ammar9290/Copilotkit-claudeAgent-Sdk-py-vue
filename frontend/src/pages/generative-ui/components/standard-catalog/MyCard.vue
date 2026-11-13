<!--
  `src/components/MyCard.vue` from the Standard catalog page (Vue tab). The
  page's markup plus a data-testid and a small "MyCard" tag (ours) so a
  recording shows that the override is the component that rendered.
-->
<template>
  <div class="my-card relative rounded-2xl border p-6 shadow-sm" data-testid="my-card">
    <span class="absolute right-3 top-2 font-mono text-[10px] text-[var(--accent)]">MyCard</span>
    <slot name="child" />
    <slot name="children" />
  </div>
</template>
