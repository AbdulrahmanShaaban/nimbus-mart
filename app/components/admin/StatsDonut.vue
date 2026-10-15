<script setup lang="ts">
import { ChartPie } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  segments: { label: string; value: number; color: string }[]
  total: number
  title: string
}>()

const { t } = useI18n()

const SIZE = 176
const RADIUS = 62
const STROKE = 22
const CENTER = SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const countFormat = new Intl.NumberFormat('en')
const percentFormat = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 })

const visibleSegments = computed(() => props.segments.filter((segment) => segment.value > 0))

const arcs = computed(() => {
  let offset = 0
  return visibleSegments.value.map((segment) => {
    const fraction = props.total > 0 ? segment.value / props.total : 0
    const length = fraction * CIRCUMFERENCE
    const arc = { ...segment, dashLength: length, dashGap: CIRCUMFERENCE - length, dashOffset: -offset }
    offset += length
    return arc
  })
})

function percentOf(value: number): string {
  if (props.total <= 0) return '0%'
  return percentFormat.format(value / props.total)
}
</script>

<template>
  <section class="flex min-w-0 flex-col rounded-xl border border-line bg-white p-5">
    <h3 class="text-sm font-bold text-navy">{{ title }}</h3>

    <div
      v-if="total === 0"
      class="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/30 px-4 py-10 text-center"
    >
      <ChartPie class="h-8 w-8 text-mutedtext" :aria-hidden="true" />
      <p class="text-sm font-semibold text-navy">{{ t('dashboard.emptyChart') }}</p>
      <p class="text-xs text-mutedtext">{{ t('dashboard.emptyChartHint') }}</p>
    </div>

    <template v-else>
      <div class="mt-4">
        <svg :width="SIZE" :height="SIZE" role="img" :aria-label="title" class="mx-auto block">
          <g :transform="`rotate(-90 ${CENTER} ${CENTER})`">
            <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" fill="none" stroke="#f3f4f6" :stroke-width="STROKE" />
            <circle
              v-for="arc in arcs"
              :key="arc.label"
              :cx="CENTER"
              :cy="CENTER"
              :r="RADIUS"
              fill="none"
              :stroke="arc.color"
              :stroke-width="STROKE"
              :stroke-dasharray="`${arc.dashLength} ${arc.dashGap}`"
              :stroke-dashoffset="arc.dashOffset"
            />
          </g>
          <text
            :x="CENTER"
            :y="CENTER + 2"
            text-anchor="middle"
            font-size="26"
            font-weight="700"
            fill="#0C287B"
          >
            {{ countFormat.format(total) }}
          </text>
        </svg>
      </div>

      <ul class="mt-4 space-y-2">
        <li v-for="segment in segments" :key="segment.label" class="flex items-center justify-between gap-3 text-sm">
          <span class="flex min-w-0 items-center gap-2">
            <span
              class="h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: segment.color }"
              aria-hidden="true"
            />
            <span class="truncate text-navy">{{ segment.label }}</span>
          </span>
          <span class="flex shrink-0 items-center gap-2 tabular-nums">
            <span class="font-semibold text-navy">{{ countFormat.format(segment.value) }}</span>
            <span class="text-xs text-mutedtext">{{ percentOf(segment.value) }}</span>
          </span>
        </li>
      </ul>
    </template>
  </section>
</template>
