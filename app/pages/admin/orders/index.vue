<script setup lang="ts">
import { Search, Eye } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage, adminStatusClass, useAdminDateFormat } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()
const { adminFormatDate } = useAdminDateFormat()

useHead(() => ({ title: `${t('orders.title')} — ${t('header.brand')}` }))

interface OrderListItem {
  orderNumber: string
  name: string
  phone: string
  email: string
  status: string
  totalCents: string
  itemCount: number
  createdAt: string
  governorate: string
}

interface OrdersResponse {
  items: OrderListItem[]
  total: number
  page: number
}

const { formatBase } = useCurrency()

const q = ref('')
const statusFilter = ref('')
const page = ref(1)
const debouncedQ = ref('')

let searchTimer: ReturnType<typeof setTimeout> | undefined

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedQ.value = q.value.trim()
    page.value = 1
  }, 400)
}

function onStatusChange() {
  page.value = 1
}

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  'admin-orders-list',
  () =>
    requestFetch<OrdersResponse>('/api/admin/orders', {
      query: {
        q: debouncedQ.value || undefined,
        status: statusFilter.value || undefined,
        page: page.value,
        limit: 20,
      },
    }),
  { watch: [debouncedQ, statusFilter, page] },
)

const totalPages = computed(() => {
  if (!data.value) return 1
  return Math.max(1, Math.ceil(data.value.total / 20))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-navy">{{ t('orders.title') }}</h1>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
        @click="refresh()"
      >
        {{ t('orders.refresh') }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-56 flex-1">
        <Search class="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedtext" :aria-hidden="true" />
        <input
          v-model="q"
          type="search"
          :placeholder="t('orders.searchPlaceholder')"
          class="w-full rounded-lg border border-line bg-white px-3 py-2 pe-9 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :aria-label="t('orders.searchAria')"
          @input="onSearchInput"
        >
      </div>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
        :aria-label="t('orders.filterStatusAria')"
        @change="onStatusChange"
      >
        <option value="">{{ t('orders.all') }}</option>
        <option value="PLACED">{{ t('status.PLACED') }}</option>
        <option value="PROCESSING">{{ t('status.PROCESSING') }}</option>
        <option value="SHIPPED">{{ t('status.SHIPPED') }}</option>
        <option value="DELIVERED">{{ t('status.DELIVERED') }}</option>
        <option value="CANCELLED">{{ t('status.CANCELLED') }}</option>
      </select>
    </div>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      {{ t('orders.loading') }}
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

    <template v-else-if="data">
      <div v-if="data.items.length === 0" class="rounded-xl border border-line bg-white px-4 py-10 text-center text-sm text-mutedtext">
        {{ t('orders.empty') }}
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50">
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.orderNumber') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.customer') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.total') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.itemsCount') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.status') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.date') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in data.items"
              :key="o.orderNumber"
              class="border-t border-line transition-colors hover:bg-surface/40"
            >
              <td class="px-4 py-3 font-semibold">
                <bdi dir="ltr">{{ o.orderNumber }}</bdi>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-navy">{{ o.name }}</p>
                <p class="text-xs text-mutedtext" dir="ltr">{{ o.phone }}</p>
              </td>
              <td class="px-4 py-3 whitespace-nowrap">{{ formatBase(o.totalCents) }}</td>
              <td class="px-4 py-3">{{ o.itemCount }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="adminStatusClass(o.status)">
                  {{ t('status.' + o.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-mutedtext">{{ adminFormatDate(o.createdAt) }}</td>
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/admin/orders/${o.orderNumber}`"
                  class="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-navy transition-colors hover:bg-surface/60"
                >
                  <Eye class="h-3.5 w-3.5" :aria-hidden="true" />
                  <span>{{ t('orders.view') }}</span>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-mutedtext">
          {{ t('orders.summary', { total: data.total, page: data.page, pages: totalPages }) }}
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60 disabled:opacity-40"
            :disabled="page <= 1"
            @click="page -= 1"
          >
            {{ t('common.prev') }}
          </button>
          <button
            type="button"
            class="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60 disabled:opacity-40"
            :disabled="page >= totalPages"
            @click="page += 1"
          >
            {{ t('common.next') }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
