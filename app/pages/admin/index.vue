<script setup lang="ts">
import { Package, ShoppingCart, Users, Wallet, TriangleAlert } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage, adminStatusClass, useAdminDateFormat } from '~/utils/admin-status'
import { useLocalized } from '~/composables/useLocalized'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()
const { pick } = useLocalized()
const { adminFormatDate } = useAdminDateFormat()

useHead(() => ({ title: `${t('dashboard.title')} — ${t('header.brand')}` }))

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
}

const { formatBase } = useCurrency()
const requestFetch = useRequestFetch()

const { data, pending, error, refresh } = await useAsyncData(
  'admin-stats',
  () => requestFetch<StatsResponse>('/api/admin/stats'),
)

const stats = computed(() => data.value)

const cards = computed(() => [
  { label: t('nav.products'), value: stats.value ? String(stats.value.products) : '—', icon: Package },
  { label: t('nav.orders'), value: stats.value ? String(stats.value.orders) : '—', icon: ShoppingCart },
  { label: t('nav.users'), value: stats.value ? String(stats.value.customers) : '—', icon: Users },
  { label: t('dashboard.revenue'), value: stats.value ? formatBase(stats.value.revenueCents) : '—', icon: Wallet },
])
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

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      {{ t('dashboard.loading') }}
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
        <div v-for="card in cards" :key="card.label" class="rounded-xl border border-line bg-white p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm text-mutedtext">{{ card.label }}</p>
            <component :is="card.icon" class="h-5 w-5 text-brand" :aria-hidden="true" />
          </div>
          <p class="mt-2 text-2xl font-extrabold text-navy">{{ card.value }}</p>
        </div>
      </div>

      <div
        v-if="stats.lowStock > 0"
        class="rounded-xl border border-amber-200 bg-amber-50 p-5"
        role="status"
      >
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

      <section class="overflow-hidden rounded-xl border border-line bg-white">
        <h2 class="border-b border-line bg-surface/50 px-4 py-3 text-sm font-bold text-navy">{{ t('dashboard.recentOrders') }}</h2>
        <div v-if="stats.recentOrders.length === 0" class="px-4 py-8 text-center text-sm text-mutedtext">
          {{ t('dashboard.noOrders') }}
        </div>
        <table v-else class="w-full text-sm">
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
              <td class="px-4 py-3">{{ formatBase(o.totalCents) }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="adminStatusClass(o.status)"
                >
                  {{ t('status.' + o.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-mutedtext">{{ adminFormatDate(o.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>
