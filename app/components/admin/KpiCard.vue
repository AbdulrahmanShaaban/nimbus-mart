<script setup lang="ts">
import { Minus, TrendingDown, TrendingUp } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  label: string
  value: string
  delta?: { dir: 'up' | 'down' | 'flat'; text: string }
  hint?: string
  href?: string
}>()

const { t } = useI18n()

const deltaClass = computed(() => {
  switch (props.delta?.dir) {
    case 'up':
      return 'bg-green-100 text-green-800'
    case 'down':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-surface text-mutedtext'
  }
})

const deltaIcon = computed(() => {
  switch (props.delta?.dir) {
    case 'up':
      return TrendingUp
    case 'down':
      return TrendingDown
    default:
      return Minus
  }
})
</script>

<template>
  <div
    class="group relative rounded-xl border border-line bg-white p-5 transition-colors"
    :class="href ? 'hover:border-brand/40' : ''"
  >
    <NuxtLink
      v-if="href"
      :to="href"
      class="absolute inset-0 rounded-xl focus-visible:ring-2 focus-visible:ring-brand"
      :aria-label="label"
    />
    <p class="text-sm text-mutedtext">{{ label }}</p>
    <p class="mt-2 text-2xl font-extrabold text-navy tabular-nums">{{ value }}</p>
    <div class="mt-2 flex min-h-5 flex-wrap items-center gap-2">
      <span
        v-if="delta"
        class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        :class="deltaClass"
        :title="t('dashboard.vsPrev')"
      >
        <component :is="deltaIcon" class="h-3.5 w-3.5" :aria-hidden="true" />
        <bdi dir="ltr">{{ delta.text }}</bdi>
      </span>
      <span v-if="hint" class="text-xs text-mutedtext">{{ hint }}</span>
    </div>
  </div>
</template>
