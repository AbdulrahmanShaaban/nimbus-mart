<script setup lang="ts">
import { CircleCheck, ListOrdered } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { OrderDetailDto } from '~/types/api'

const { t } = useI18n()

useHead(() => ({ title: `${t('checkout.successMeta')} — ${t('header.brand')}` }))

const route = useRoute()
const { user } = useAuth()
const { formatBase } = useCurrency()
const { refresh: refreshCart } = useCart()
const orderNumber = computed(() => (typeof route.query.order === 'string' ? route.query.order : ''))

onMounted(() => {
  refreshCart()
})

const requestFetch = useRequestFetch()
const { data: orderData } = await useAsyncData(
  () => `success-order:${orderNumber.value}`,
  () =>
    orderNumber.value
      ? requestFetch<OrderDetailDto>(`/api/orders/${orderNumber.value}`)
      : Promise.resolve(null),
  { watch: [orderNumber] },
)

const order = computed(() => orderData.value)
</script>

<template>
  <div class="mx-auto max-w-[640px] px-4 py-16 text-center md:py-24">
    <span class="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600">
      <CircleCheck :size="40" aria-hidden="true" />
    </span>
    <h1 class="mb-3 text-2xl font-extrabold text-navy md:text-3xl">{{ t('checkout.successTitle') }}</h1>
    <p class="mb-2 text-bodytext">{{ t('checkout.successThanks') }}</p>
    <p v-if="orderNumber" class="mb-2 text-sm text-mutedtext">
      {{ t('checkout.orderNumber') }}: <bdi dir="ltr" class="font-black text-navy">{{ orderNumber }}</bdi>
    </p>
    <p v-else class="mb-2 text-sm text-mutedtext">{{ t('checkout.orderNumberMissing') }}</p>

    <dl v-if="order" class="mx-auto mb-8 flex max-w-sm flex-col gap-2 rounded-2xl border border-line bg-white p-5 text-sm">
      <div class="flex items-center justify-between">
        <dt class="text-bodytext">{{ t('checkout.status') }}</dt>
        <dd><StatusBadge :status="order.status" /></dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="text-bodytext">{{ t('checkout.total') }}</dt>
        <dd class="font-black text-navy">{{ formatBase(order.totalCents) }}</dd>
      </div>
    </dl>

    <div class="flex flex-wrap items-center justify-center gap-3">
      <NuxtLink
        v-if="user && orderNumber"
        :to="`/account/orders/${orderNumber}`"
        class="flex h-11 items-center gap-2 rounded-xl bg-neon px-6 text-sm font-black text-brand-alt transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ListOrdered :size="16" aria-hidden="true" />
        {{ t('checkout.viewDetails') }}
      </NuxtLink>
      <NuxtLink
        v-else-if="!user && orderNumber"
        :to="{ path: '/login', query: { redirect: `/account/orders/${orderNumber}` } }"
        class="flex h-11 items-center gap-2 rounded-xl bg-neon px-6 text-sm font-black text-brand-alt transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ListOrdered :size="16" aria-hidden="true" />
        {{ t('checkout.loginToView') }}
      </NuxtLink>
      <NuxtLink
        to="/"
        class="flex h-11 items-center rounded-xl border border-line px-6 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
      >
        {{ t('error.backHome') }}
      </NuxtLink>
    </div>
  </div>
</template>
