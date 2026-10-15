<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage, useAdminDateFormat } from '~/utils/admin-status'
import { useLocalized } from '~/composables/useLocalized'
import AdminKpiCard from '~/components/admin/KpiCard.vue'
import AdminStatsAreaChart from '~/components/admin/StatsAreaChart.vue'
import AdminStatsBarList from '~/components/admin/StatsBarList.vue'
import AdminStatsDonut from '~/components/admin/StatsDonut.vue'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()
const { pick } = useLocalized()
const { adminFormatDate } = useAdminDateFormat()
const { formatBase } = useCurrency()

useHead(() => ({ title: `${t('dashboard.title')} — ${t('header.brand')}` }))

type DeltaDir = 'up' | 'down' | 'flat'

interface KpiDelta {
  dir: DeltaDir
  text: string
}

interface StatsResponse {
  products: number
  orders: number
  customers: number
  revenueCents: string
  lowStock: number
  lowStockItems: { sku: string; titleAr: string; titleEn: string | null; stock: number }[]
  recentOrders: {
    orderNumber: string
    name: string
    totalCents: string
    status: string
    createdAt: string
  }[]
  kpi: {
    revenue30: { cents: string; prevCents: string }
    orders30: { count: number; prevCount: number }
    customers30: { count: number; prevCount: number }
  }
  daily: { day: string; revenueCents: string; orders: number }[]
  statusCounts: { status: string; count: number }[]
  topProducts: {
    productId: string
    slug: string
    titleAr: string
    titleEn: string | null
    units: number
    revenueCents: string
  }[]
}

interface KpiCardData {
  label: string
  value: string
  delta?: KpiDelta
  hint?: string
  href?: string
}

const requestFetch = useRequestFetch()

const { data, pending, error, refresh } = await useAsyncData(
  'admin-stats',
  () => requestFetch<StatsResponse>('/api/admin/stats'),
)

const stats = computed(() => data.value)

const countFormat = new Intl.NumberFormat('en')
const percentFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 1 })

const STATUS_COLORS: Record<string, string> = {
  PLACED: '#d97706',
  PROCESSING: '#2563eb',
  SHIPPED: '#7c3aed',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626',
}

function deltaOf(current: number | bigint, previous: number | bigint): KpiDelta {
  const currentValue = Number(current)
  const previousValue = Number(previous)
  if (previousValue === 0) {
    return currentValue === 0 ? { dir: 'flat', text: '0%' } : { dir: 'up', text: t('dashboard.new') }
  }
  const percent = ((currentValue - previousValue) / previousValue) * 100
  if (percent === 0) return { dir: 'flat', text: '0%' }
  return {
    dir: percent > 0 ? 'up' : 'down',
    text: `${percent > 0 ? '+' : ''}${percentFormat.format(percent)}%`,
  }
}

const kpiCards = computed<KpiCardData[]>(() => {
  const s = stats.value
  if (!s) return []
  return [
    {
      label: t('dashboard.revenue'),
      value: formatBase(s.kpi.revenue30.cents),
      delta: deltaOf(BigInt(s.kpi.revenue30.cents), BigInt(s.kpi.revenue30.prevCents)),
      hint: t('dashboard.last30'),
      href: '/admin/orders',
    },
    {
      label: t('nav.orders'),
      value: countFormat.format(s.kpi.orders30.count),
      delta: deltaOf(s.kpi.orders30.count, s.kpi.orders30.prevCount),
      hint: t('dashboard.last30'),
      href: '/admin/orders',
    },
    {
      label: t('dashboard.newCustomers'),
      value: countFormat.format(s.kpi.customers30.count),
      delta: deltaOf(s.kpi.customers30.count, s.kpi.customers30.prevCount),
      hint: t('dashboard.last30'),
      href: '/admin/users',
    },
    {
      label: t('nav.products'),
      value: countFormat.format(s.products),
      hint: t('dashboard.catalogHint'),
      href: '/admin/products',
    },
  ]
})

const metric = ref<'revenue' | 'orders'>('revenue')

const metricOptions = computed(() => [
  { key: 'revenue' as const, label: t('dashboard.revenue') },
  { key: 'orders' as const, label: t('nav.orders') },
])

const dailyLabels = computed(() =>
  (stats.value?.daily ?? []).map((day) => `${day.day.slice(8, 10)}/${day.day.slice(5, 7)}`),
)

const chartValues = computed(() => {
  const daily = stats.value?.daily ?? []
  if (metric.value === 'revenue') return daily.map((day) => Number(day.revenueCents))
  return daily.map((day) => day.orders)
})

const chartFormat = computed(() => {
  if (metric.value === 'revenue') return (value: number) => formatBase(String(value))
  return (value: number) => countFormat.format(value)
})

const chartTitle = computed(() => (metric.value === 'revenue' ? t('dashboard.revenue') : t('nav.orders')))

const donutSegments = computed(() =>
  (stats.value?.statusCounts ?? []).map((row) => ({
    label: t(`status.${row.status}`),
    value: row.count,
    color: STATUS_COLORS[row.status] ?? '#737373',
  })),
)

const donutTotal = computed(() => donutSegments.value.reduce((sum, segment) => sum + segment.value, 0))

const topProductItems = computed(() =>
  [...(stats.value?.topProducts ?? [])]
    .sort((a, b) => b.units - a.units)
    .map((product) => ({
      label: pick(product.titleAr, product.titleEn),
      value: product.units,
      sub: formatBase(product.revenueCents),
    })),
)

function topProductFormat(value: number): string {
  return t('dashboard.unitsShort', { count: value, n: countFormat.format(value) })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-extrabold text-navy">{{ t('dashboard.title') }}</h1>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
        @click="refresh()"
      >
        {{ t('dashboard.refresh') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-6" role="status">
      <span class="sr-only">{{ t('dashboard.loading') }}</span>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 4" :key="n" class="rounded-xl border border-line bg-white p-5" aria-hidden="true">
          <div class="h-5 w-20 animate-pulse rounded bg-surface" />
          <div class="mt-2 h-8 w-28 animate-pulse rounded bg-surface" />
          <div class="mt-2 h-5 w-32 animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="h-[360px] animate-pulse rounded-xl border border-line bg-white lg:col-span-2" aria-hidden="true" />
        <div class="h-[360px] animate-pulse rounded-xl border border-line bg-white" aria-hidden="true" />
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="h-[300px] animate-pulse rounded-xl border border-line bg-white" aria-hidden="true" />
        <div class="h-[300px] animate-pulse rounded-xl border border-line bg-white" aria-hidden="true" />
      </div>
      <div class="h-[280px] animate-pulse rounded-xl border border-line bg-white" aria-hidden="true" />
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700" role="alert">
      <p>{{ adminFetchMessage(error, t('common.operationFailed')) }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <template v-else-if="stats">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminKpiCard
          v-for="card in kpiCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :delta="card.delta"
          :hint="card.hint"
          :href="card.href"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-extrabold text-navy">{{ t('dashboard.trendTitle') }}</h2>
        <div
          class="inline-flex rounded-lg border border-line bg-white p-0.5"
          role="group"
          :aria-label="t('dashboard.metricAria')"
        >
          <button
            v-for="option in metricOptions"
            :key="option.key"
            type="button"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition-colors"
            :class="metric === option.key ? 'bg-navy text-white' : 'text-mutedtext hover:text-navy'"
            :aria-pressed="metric === option.key"
            @click="metric = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <AdminStatsAreaChart
          class="lg:col-span-2"
          :values="chartValues"
          :labels="dailyLabels"
          :title="chartTitle"
          :format-value="chartFormat"
        />
        <AdminStatsDonut :segments="donutSegments" :total="donutTotal" :title="t('dashboard.statusTitle')" />
      </div>

      <div class="grid gap-4" :class="stats.lowStock > 0 ? 'lg:grid-cols-2' : ''">
        <AdminStatsBarList
          :title="t('dashboard.topProducts')"
          :items="topProductItems"
          :format-value="topProductFormat"
        />

        <div v-if="stats.lowStock > 0" class="rounded-xl border border-amber-200 bg-amber-50 p-5" role="status">
          <div class="mb-2 flex items-center gap-2 text-amber-800">
            <TriangleAlert class="h-5 w-5" :aria-hidden="true" />
            <h2 class="text-sm font-bold">
              {{ t('dashboard.lowStock', { count: stats.lowStock }) }}
            </h2>
          </div>
          <ul class="space-y-1 text-sm text-amber-900">
            <li v-for="item in stats.lowStockItems" :key="item.sku" class="flex items-center justify-between gap-3">
              <span>{{ pick(item.titleAr, item.titleEn) }} — <bdi dir="ltr">{{ item.sku }}</bdi></span>
              <span class="font-semibold">{{ t('dashboard.remaining', { stock: item.stock }) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <section class="overflow-hidden rounded-xl border border-line bg-white">
        <h2 class="border-b border-line bg-surface/50 px-4 py-3 text-sm font-bold text-navy">{{ t('dashboard.recentOrders') }}</h2>
        <div v-if="stats.recentOrders.length === 0" class="px-4 py-8 text-center text-sm text-mutedtext">
          {{ t('dashboard.noOrders') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[560px] text-sm">
            <thead>
              <tr class="bg-surface/50">
                <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('dashboard.orderNumber') }}</th>
                <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('dashboard.customer') }}</th>
                <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('dashboard.total') }}</th>
                <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('dashboard.status') }}</th>
                <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('dashboard.date') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="o in stats.recentOrders"
                :key="o.orderNumber"
                class="border-t border-line transition-colors hover:bg-surface/40"
              >
                <td class="px-4 py-3">
                  <NuxtLink
                    :to="`/admin/orders/${o.orderNumber}`"
                    class="font-semibold text-brand hover:underline"
                  >
                    <bdi dir="ltr">{{ o.orderNumber }}</bdi>
                  </NuxtLink>
                </td>
                <td class="px-4 py-3">{{ o.name }}</td>
                <td class="px-4 py-3 whitespace-nowrap">{{ formatBase(o.totalCents) }}</td>
                <td class="px-4 py-3">
                  <StatusBadge :status="o.status" />
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-mutedtext">{{ adminFormatDate(o.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
