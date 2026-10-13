<script setup lang="ts">
import { ChevronLeft, ChevronRight, ListOrdered } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { AccountOrderListDto } from '~/types/api'

const { t } = useI18n()
const { adminFormatDate } = useAdminDateFormat()

definePageMeta({ middleware: ['auth'] })
useHead(() => ({ title: `${t('account.orders')} — ${t('header.brand')}` }))

const route = useRoute()
const { formatBase } = useCurrency()

const page = computed(() => {
  const raw = route.query.page
  const parsed = typeof raw === 'string' ? Number.parseInt(raw, 10) : 1
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
})

const pageSize = 10

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  () => `account-orders:${page.value}`,
  () => requestFetch<AccountOrderListDto>('/api/account/orders', { params: { page: page.value, limit: pageSize } }),
  { watch: [page] },
)

const orders = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function goToPage(next: number) {
  if (next < 1 || next > totalPages.value || next === page.value) return
  return navigateTo({ path: '/account/orders', query: next > 1 ? { page: String(next) } : {} })
}
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <h1 class="mb-6 text-2xl font-extrabold text-navy md:text-3xl">{{ t('account.orders') }}</h1>

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">{{ t('common.loading') }}</div>

    <div v-else-if="error" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">{{ t('account.ordersErrorTitle') }}</p>
      <p class="mb-4 text-sm text-mutedtext">{{ t('account.errorHint') }}</p>
      <button
        type="button"
        class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <EmptyState
      v-else-if="orders.length === 0"
      :title="t('account.ordersEmptyTitle')"
      :hint="t('account.ordersEmptyHint')"
      :action-label="t('common.shopNow')"
      action-href="/products"
      :icon="ListOrdered"
    />

    <template v-else>
      <ul class="flex flex-col gap-3">
        <li v-for="order in orders" :key="order.orderNumber">
          <NuxtLink
            :to="`/account/orders/${order.orderNumber}`"
            class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
          >
            <div>
              <p class="text-sm font-black text-navy">
                {{ t('account.orderNumber') }}: <bdi dir="ltr">{{ order.orderNumber }}</bdi>
              </p>
              <p class="mt-1 text-xs text-mutedtext">{{ adminFormatDate(order.createdAt) }} · {{ t('account.itemsCount', { count: order.itemCount }) }}</p>
            </div>
            <div class="flex items-center gap-4">
              <StatusBadge :status="order.status" />
              <span class="text-sm font-black text-navy">{{ formatBase(order.totalCents) }}</span>
              <ChevronLeft :size="18" class="text-mutedtext" aria-hidden="true" />
            </div>
          </NuxtLink>
        </li>
      </ul>

      <nav
        v-if="totalPages > 1"
        class="mt-8 flex flex-wrap items-center justify-center gap-3"
        :aria-label="t('account.ordersNavAria')"
      >
        <button
          type="button"
          class="flex items-center gap-1 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          <ChevronRight :size="16" aria-hidden="true" />
          {{ t('common.prev') }}
        </button>
        <span class="text-sm text-mutedtext">{{ t('account.pageOf', { page, total: totalPages }) }}</span>
        <button
          type="button"
          class="flex items-center gap-1 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
          :disabled="page >= totalPages"
          @click="goToPage(page + 1)"
        >
          {{ t('common.next') }}
          <ChevronLeft :size="16" aria-hidden="true" />
        </button>
      </nav>
    </template>
  </div>
</template>
