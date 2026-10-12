<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 8 })
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="status" aria-live="polite">
    <span class="sr-only">جاري التحميل…</span>
    <div
      v-for="index in count"
      :key="index"
      class="animate-pulse rounded-2xl border border-line bg-white p-3"
      aria-hidden="true"
    >
      <div class="aspect-square rounded-xl bg-surface" />
      <div class="mt-3 h-3 w-3/4 rounded bg-surface" />
      <div class="mt-2 h-3 w-1/2 rounded bg-surface" />
      <div class="mt-4 h-4 w-1/3 rounded bg-surface" />
    </div>
  </div>
</template>
