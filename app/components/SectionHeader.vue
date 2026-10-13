<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  href?: string
  hrefLabel?: string
  center?: boolean
}>()

const { t, locale } = useI18n()
const ArrowIcon = computed(() => (locale.value === 'en' ? ArrowRight : ArrowLeft))
</script>

<template>
  <div v-if="center" class="mb-4 text-center md:mb-6">
    <h2 class="text-xl font-extrabold leading-tight text-navy md:text-3xl">
      {{ title }}
    </h2>
  </div>
  <div v-else class="mb-4 flex items-baseline justify-between gap-4 md:mb-6">
    <h2 class="text-xl font-extrabold leading-tight text-navy md:text-3xl">
      {{ title }}
    </h2>
    <NuxtLink
      v-if="href"
      :to="href"
      class="flex shrink-0 items-center gap-1 rounded text-base text-brand transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-brand"
    >
      {{ hrefLabel ?? t('common.viewAll') }}
      <component :is="ArrowIcon" :size="16" aria-hidden="true" />
    </NuxtLink>
  </div>
</template>
