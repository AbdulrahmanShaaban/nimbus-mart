<script setup lang="ts">
import { ChartColumn } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title: string
  items: { label: string; value: number; sub?: string }[]
  formatValue?: (n: number) => string
}>()

const { t } = useI18n()

const countFormat = new Intl.NumberFormat('en')

const maxValue = computed(() => props.items.reduce((max, item) => Math.max(max, item.value), 0))

function displayValue(value: number): string {
  return props.formatValue ? props.formatValue(value) : countFormat.format(value)
}

function barWidth(value: number): string {
  if (maxValue.value <= 0) return '0%'
  const percent = Math.min(Math.max((value / maxValue.value) * 100, 2), 100)
  return `${percent}%`
}
</script>

<template>
  <section class="flex flex-col rounded-xl border border-line bg-white p-5">
    <h3 class="text-sm font-bold text-navy">{{ title }}</h3>

    <div
      v-if="items.length === 0"
      class="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/30 px-4 py-10 text-center"
    >
      <ChartColumn class="h-8 w-8 text-mutedtext" :aria-hidden="true" />
      <p class="text-sm font-semibold text-navy">{{ t('dashboard.emptyChart') }}</p>
      <p class="text-xs text-mutedtext">{{ t('dashboard.emptyChartHint') }}</p>
    </div>

    <ul v-else class="mt-4 space-y-4">
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <div class="flex items-baseline justify-between gap-3">
          <p class="min-w-0 truncate text-sm font-medium text-navy">{{ item.label }}</p>
          <p class="shrink-0 text-sm font-semibold text-navy tabular-nums">{{ displayValue(item.value) }}</p>
        </div>
        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface">
          <div class="h-full rounded-full bg-navy" :style="{ width: barWidth(item.value) }" />
        </div>
        <p v-if="item.sub" class="mt-1 text-xs text-mutedtext tabular-nums">{{ item.sub }}</p>
      </li>
    </ul>
  </section>
</template>
