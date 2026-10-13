<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

defineProps<{ items: { label: string; href?: string }[] }>()

const { t, locale } = useI18n()
const ChevronIcon = computed(() => (locale.value === 'en' ? ChevronRight : ChevronLeft))
</script>

<template>
  <nav :aria-label="t('nav.breadcrumb')" class="mb-5">
    <ol class="flex flex-wrap items-center gap-1.5 text-sm text-mutedtext">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`" class="flex items-center gap-1.5">
        <component
          :is="ChevronIcon"
          v-if="index > 0"
          :size="14"
          class="shrink-0 text-mutedtext/70"
          aria-hidden="true"
        />
        <NuxtLink
          v-if="item.href && index < items.length - 1"
          :to="item.href"
          class="text-mutedtext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          {{ item.label }}
        </NuxtLink>
        <span v-else class="font-semibold text-navy" aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
