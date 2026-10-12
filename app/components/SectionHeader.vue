<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

defineProps<{
  title: string
  href?: string
  hrefLabel?: string
  center?: boolean
}>()
</script>

<template>
  <div v-if="center" class="mb-6 text-center">
    <h2 class="text-2xl font-extrabold leading-tight text-navy md:text-3xl">
      {{ title }}
    </h2>
  </div>
  <div v-else class="mb-6 flex items-baseline justify-between gap-4">
    <h2 class="text-2xl font-extrabold leading-tight text-navy md:text-3xl">
      {{ title }}
    </h2>
    <NuxtLink
      v-if="href"
      :to="href"
      class="flex shrink-0 items-center gap-1 rounded text-base text-brand transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-brand"
    >
      {{ hrefLabel ?? 'عرض الكل' }}
      <ArrowLeft :size="16" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
