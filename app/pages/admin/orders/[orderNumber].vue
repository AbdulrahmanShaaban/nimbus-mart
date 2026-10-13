<script setup lang="ts">
import { ArrowRight, RefreshCw } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage, adminStatusClass, useAdminDateFormat } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()
const { adminFormatDate } = useAdminDateFormat()

useHead(() => ({ title: `${t('orders.title')} — ${t('header.brand')}` }))

interface OrderDetail {
  orderNumber: string
  status: string
  paymentMode: string
  email: string
  name: string
  phone: string
  governorate: string
  addressLine: string
  notes: string | null
  createdAt: string
  subtotalCents: string
  shippingCents: string
  totalCents: string
  displayCurrencyCode: string
  user: { email: string; name: string } | null
  items: {
    productTitleSnapshot: string
    variantSnapshot: string
    quantity: number
    unitPriceCents: string
    lineTotalCents: string
  }[]
}

const route = useRoute()
const orderNumber = computed(() => String(route.params.orderNumber))

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  `admin-order-${orderNumber.value}`,
  () => requestFetch<OrderDetail>(`/api/admin/orders/${encodeURIComponent(orderNumber.value)}`),
)

const { formatBase } = useCurrency()

const selectedStatus = ref('')
watch(
  data,
  (d) => {
    selectedStatus.value = d?.status ?? ''
  },
  { immediate: true },
)

const updating = ref(false)
const banner = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

async function updateStatus() {
  if (!data.value) return
  if (!selectedStatus.value || selectedStatus.value === data.value.status) {
    banner.value = { type: 'err', text: t('orders.selectNewStatus') }
    return
  }
  updating.value = true
  banner.value = null
  try {
    await $fetch(`/api/admin/orders/${encodeURIComponent(orderNumber.value)}/status`, {
      method: 'PATCH',
      body: { status: selectedStatus.value },
    })
    banner.value = { type: 'ok', text: t('orders.statusUpdated') }
    await refresh()
  } catch (e) {
    banner.value = { type: 'err', text: adminFetchMessage(e, t('common.operationFailed')) }
  } finally {
    updating.value = false
  }
}

const infoFields = computed(() => {
  const o = data.value
  if (!o) return []
  return [
    { label: t('orders.customer'), value: o.name, ltr: false },
    { label: t('orders.phone'), value: o.phone, ltr: true },
    { label: t('orders.email'), value: o.email, ltr: true },
    { label: t('orders.governorate'), value: o.governorate, ltr: false },
    { label: t('orders.address'), value: o.addressLine, ltr: false },
    ...(o.notes ? [{ label: t('orders.notes'), value: o.notes, ltr: false }] : []),
    { label: t('orders.paymentMethod'), value: t('orders.paymentOnline'), ltr: false },
  ]
})
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      to="/admin/orders"
      class="inline-flex items-center gap-1.5 text-sm text-brand transition-colors hover:underline"
    >
      <ArrowRight class="h-4 w-4" :aria-hidden="true" />
      <span>{{ t('orders.back') }}</span>
    </NuxtLink>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      {{ t('orders.loadingDetail') }}
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
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-2xl font-extrabold text-navy">
          {{ t('orders.orderLabel') }} <bdi dir="ltr">{{ data.orderNumber }}</bdi>
        </h1>
        <span
          class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="adminStatusClass(data.status)"
        >
          {{ t('status.' + data.status) }}
        </span>
      </div>

      <div
        v-if="banner"
        class="rounded-lg px-4 py-3 text-sm"
        :class="banner.type === 'ok' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'"
        role="status"
      >
        {{ banner.text }}
      </div>

      <section class="rounded-xl border border-line bg-white p-5">
        <h2 class="mb-4 text-base font-bold text-navy">{{ t('orders.infoSection') }}</h2>
        <dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="f in infoFields" :key="f.label">
            <dt class="text-xs text-mutedtext">{{ f.label }}</dt>
            <dd class="mt-0.5 text-sm font-medium text-navy" :dir="f.ltr ? 'ltr' : undefined">{{ f.value }}</dd>
          </div>
          <div>
            <dt class="text-xs text-mutedtext">{{ t('orders.accountEmail') }}</dt>
            <dd class="mt-0.5 text-sm font-medium text-navy" dir="ltr">
              <template v-if="data.user">{{ data.user.email }}</template>
              <template v-else>{{ t('orders.guest') }}</template>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-mutedtext">{{ t('orders.orderDate') }}</dt>
            <dd class="mt-0.5 text-sm font-medium text-navy">{{ adminFormatDate(data.createdAt, true) }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-xl border border-line bg-white p-5">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 class="text-base font-bold text-navy">{{ t('orders.updateSection') }}</h2>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="selectedStatus"
              class="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
              :aria-label="t('orders.newStatusAria')"
            >
              <option value="PLACED">{{ t('status.PLACED') }}</option>
              <option value="PROCESSING">{{ t('status.PROCESSING') }}</option>
              <option value="SHIPPED">{{ t('status.SHIPPED') }}</option>
              <option value="DELIVERED">{{ t('status.DELIVERED') }}</option>
              <option value="CANCELLED">{{ t('status.CANCELLED') }}</option>
            </select>
            <button
              type="button"
              class="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
              :disabled="updating"
              @click="updateStatus"
            >
              <RefreshCw class="h-4 w-4" :class="updating ? 'animate-spin' : ''" :aria-hidden="true" />
              <span>{{ updating ? t('orders.updating') : t('orders.updateButton') }}</span>
            </button>
          </div>
        </div>
        <p class="text-xs text-mutedtext">{{ t('orders.auditNote') }}</p>
      </section>

      <section class="overflow-hidden rounded-xl border border-line bg-white">
        <h2 class="border-b border-line bg-surface/50 px-4 py-3 text-sm font-bold text-navy">{{ t('orders.itemsSection') }}</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50">
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.product') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.variant') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('common.quantity') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.price') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('orders.total') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in data.items" :key="i" class="border-t border-line">
              <td class="px-4 py-3 font-medium text-navy">{{ item.productTitleSnapshot }}</td>
              <td class="px-4 py-3 text-mutedtext">{{ item.variantSnapshot }}</td>
              <td class="px-4 py-3">{{ item.quantity }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ formatBase(item.unitPriceCents) }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ formatBase(item.lineTotalCents) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-line bg-surface/40">
              <td colspan="4" class="px-4 py-2 text-end text-sm font-semibold text-navy">{{ t('orders.subtotal') }}</td>
              <td class="px-4 py-2 font-semibold text-navy whitespace-nowrap">{{ formatBase(data.subtotalCents) }}</td>
            </tr>
            <tr class="border-t border-line bg-surface/40">
              <td colspan="4" class="px-4 py-2 text-end text-sm font-semibold text-navy">{{ t('orders.shipping') }}</td>
              <td class="px-4 py-2 font-semibold text-navy whitespace-nowrap">{{ formatBase(data.shippingCents) }}</td>
            </tr>
            <tr class="border-t border-line bg-surface/60">
              <td colspan="4" class="px-4 py-2 text-end text-sm font-extrabold text-navy">{{ t('orders.total') }}</td>
              <td class="px-4 py-2 font-extrabold text-navy whitespace-nowrap">{{ formatBase(data.totalCents) }}</td>
            </tr>
          </tfoot>
        </table>
        <p class="border-t border-line px-4 py-2 text-xs text-mutedtext">
          {{ t('orders.displayCurrencyPrefix') }} <bdi dir="ltr">{{ data.displayCurrencyCode }}</bdi> {{ t('orders.displayCurrencySuffix') }}
        </p>
      </section>
    </template>
  </div>
</template>
