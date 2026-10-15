<script setup lang="ts">
import { ChartLine } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  values: number[]
  labels: string[]
  title: string
  formatValue?: (n: number) => string
}>()

const { t } = useI18n()

const WIDTH_FALLBACK = 640
const HEIGHT = 260
const PAD_START = 84
const PAD_END = 16
const PAD_TOP = 16
const PAD_BOTTOM = 28
const PLOT_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM

const width = ref(WIDTH_FALLBACK)
const root = ref<HTMLElement | null>(null)
const hoverIndex = ref<number | null>(null)
const showTable = ref(false)

let observer: ResizeObserver | null = null

watch(root, (element) => {
  observer?.disconnect()
  observer = null
  if (!element || typeof ResizeObserver === 'undefined') return
  if (element.clientWidth > 0) width.value = element.clientWidth
  observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const next = Math.round(entry.contentRect.width)
    if (next > 0) width.value = next
  })
  observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const plotWidth = computed(() => Math.max(width.value - PAD_START - PAD_END, 1))

const isEmpty = computed(() => {
  if (props.values.length === 0) return true
  if (props.values.some((value) => !Number.isFinite(value))) return true
  return props.values.every((value) => value === 0)
})

const range = computed(() => {
  const finite = props.values.filter((value) => Number.isFinite(value))
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  if (max === min) {
    return max === 0 ? { min: 0, max: 1 } : { min: min * 0.9, max: max * 1.1 }
  }
  return { min, max }
})

function xAt(index: number): number {
  if (props.values.length <= 1) return PAD_START + plotWidth.value / 2
  return PAD_START + (index / (props.values.length - 1)) * plotWidth.value
}

function yAt(value: number): number {
  const span = range.value.max - range.value.min || 1
  return PAD_TOP + (1 - (value - range.value.min) / span) * PLOT_HEIGHT
}

function format(value: number): string {
  return props.formatValue ? props.formatValue(value) : String(Math.round(value))
}

const points = computed(() => props.values.map((value, index) => ({ x: xAt(index), y: yAt(value) })))

const linePath = computed(() =>
  points.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' '),
)

const areaPath = computed(() => {
  const list = points.value
  const firstPoint = list[0]
  const lastPoint = list[list.length - 1]
  if (!firstPoint || !lastPoint) return ''
  const baseline = PAD_TOP + PLOT_HEIGHT
  const segments = list.map((point) => `L${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  return `M${firstPoint.x.toFixed(1)},${baseline} ${segments} L${lastPoint.x.toFixed(1)},${baseline} Z`
})

const lastPoint = computed(() => points.value[points.value.length - 1] ?? null)

const gridLines = computed(() => [
  { y: PAD_TOP, label: format(range.value.max) },
  { y: PAD_TOP + PLOT_HEIGHT, label: format(range.value.min) },
])

const tickIndexes = computed(() => {
  const total = props.labels.length
  if (total === 0) return []
  const step = width.value < 480 ? 7 : 5
  const indexes: number[] = []
  for (let index = 0; index < total; index += step) indexes.push(index)
  const previous = indexes[indexes.length - 1]
  const last = total - 1
  if (previous !== undefined && last - previous >= 2) indexes.push(last)
  return indexes
})

function updateHover(event: PointerEvent) {
  const element = root.value
  if (!element || props.values.length === 0) return
  const rect = element.getBoundingClientRect()
  if (rect.width === 0) return
  const svgX = ((event.clientX - rect.left) / rect.width) * width.value
  const ratio = (svgX - PAD_START) / plotWidth.value
  const index = Math.round(ratio * (props.values.length - 1))
  hoverIndex.value = Math.min(Math.max(index, 0), props.values.length - 1)
}

function clearHover() {
  hoverIndex.value = null
}

const hovered = computed(() => {
  const index = hoverIndex.value
  if (index === null) return null
  const value = props.values[index]
  const label = props.labels[index]
  const point = points.value[index]
  if (value === undefined || !point) return null
  return { value, label: label ?? '', x: point.x, y: point.y }
})

const tooltipStyle = computed(() => {
  const current = hovered.value
  if (!current) return {}
  const ratio = current.x / width.value
  const align = ratio < 0.12 ? '0' : ratio > 0.88 ? '-100%' : '-50%'
  const left = `${Math.min(Math.max(ratio, 0.04), 0.96) * 100}%`
  return { left, top: '12px', transform: `translateX(${align})` }
})

function toggleTable() {
  hoverIndex.value = null
  showTable.value = !showTable.value
}
</script>

<template>
  <section class="flex min-w-0 flex-col rounded-xl border border-line bg-white p-5">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-sm font-bold text-navy">{{ title }}</h3>
      <button
        v-if="!isEmpty"
        type="button"
        class="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-mutedtext transition-colors hover:text-navy"
        :aria-pressed="showTable"
        @click="toggleTable"
      >
        {{ showTable ? t('dashboard.viewChart') : t('dashboard.viewTable') }}
      </button>
    </div>

    <div
      v-if="isEmpty"
      class="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/30 px-4 py-10 text-center"
    >
      <ChartLine class="h-8 w-8 text-mutedtext" :aria-hidden="true" />
      <p class="text-sm font-semibold text-navy">{{ t('dashboard.emptyChart') }}</p>
      <p class="text-xs text-mutedtext">{{ t('dashboard.emptyChartHint') }}</p>
    </div>

    <div v-else-if="showTable" class="mt-4 max-h-[260px] overflow-auto">
      <table class="w-full text-sm">
        <caption class="sr-only">{{ title }}</caption>
        <thead class="sticky top-0 bg-white">
          <tr>
            <th scope="col" class="px-2 py-2 text-start text-xs font-semibold text-mutedtext">
              {{ t('dashboard.tableColDay') }}
            </th>
            <th scope="col" class="px-2 py-2 text-start text-xs font-semibold text-mutedtext">
              {{ t('dashboard.tableColValue') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(label, index) in labels" :key="`${label}-${index}`" class="border-t border-line">
            <td class="px-2 py-1.5 text-mutedtext"><bdi dir="ltr">{{ label }}</bdi></td>
            <td class="px-2 py-1.5 font-semibold text-navy tabular-nums">{{ format(values[index] ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else
      ref="root"
      dir="ltr"
      class="relative mt-4"
      @pointermove="updateHover"
      @pointerdown="updateHover"
      @pointerleave="clearHover"
    >
      <svg :width="width" :height="HEIGHT" role="img" :aria-label="title" class="block max-w-full">
        <defs>
          <linearGradient id="nm-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0C287B" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#0C287B" stop-opacity="0" />
          </linearGradient>
        </defs>

        <line
          v-for="(grid, gridIndex) in gridLines"
          :key="`grid-${gridIndex}`"
          :x1="PAD_START"
          :x2="width - PAD_END"
          :y1="grid.y"
          :y2="grid.y"
          stroke="#e5e7eb"
          stroke-width="1"
        />
        <text
          v-for="(grid, gridIndex) in gridLines"
          :key="`grid-label-${gridIndex}`"
          :x="PAD_START - 10"
          :y="grid.y + 4"
          text-anchor="end"
          font-size="11"
          fill="#737373"
        >
          {{ grid.label }}
        </text>

        <path :d="areaPath" fill="url(#nm-area-fill)" />
        <path
          :d="linePath"
          fill="none"
          stroke="#0C287B"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <line
          v-if="hovered"
          :x1="hovered.x"
          :x2="hovered.x"
          :y1="PAD_TOP"
          :y2="PAD_TOP + PLOT_HEIGHT"
          stroke="#0C287B"
          stroke-width="1"
          stroke-dasharray="4 4"
          opacity="0.35"
        />
        <circle
          v-if="hovered"
          :cx="hovered.x"
          :cy="hovered.y"
          r="4"
          fill="#0C287B"
          stroke="#ffffff"
          stroke-width="2"
        />
        <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="3.5" fill="#0C287B" />

        <text
          v-for="index in tickIndexes"
          :key="`tick-${index}`"
          :x="xAt(index)"
          :y="HEIGHT - 8"
          text-anchor="middle"
          font-size="10"
          fill="#737373"
        >
          {{ labels[index] ?? '' }}
        </text>
      </svg>

      <div
        v-if="hovered"
        dir="auto"
        class="pointer-events-none absolute z-10 rounded-lg border border-line bg-white px-2.5 py-1.5 shadow-sm"
        :style="tooltipStyle"
      >
        <p class="text-xs text-mutedtext"><bdi dir="ltr">{{ hovered.label }}</bdi></p>
        <p class="text-xs font-semibold text-navy">{{ format(hovered.value) }}</p>
      </div>
    </div>
  </section>
</template>
