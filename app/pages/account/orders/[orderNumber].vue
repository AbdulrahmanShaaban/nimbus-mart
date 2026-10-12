<script setup lang="ts">
import type { OrderDetailDto } from '~/types/api'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'تفاصيل الطلب — نِمبوس مارت' })

const route = useRoute()
const orderNumber = computed(() => (typeof route.params.orderNumber === 'string' ? route.params.orderNumber : ''))

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  () => `account-order:${orderNumber.value}`,
  () => requestFetch<OrderDetailDto>(`/api/account/orders/${orderNumber.value}`),
  { watch: [orderNumber] },
)

const order = computed(() => data.value)
const { formatBase } = useCurrency()

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeZone: 'Africa/Cairo',
    calendar: 'gregory',
  }).format(new Date(iso))
}
</script>

<template>
  <div class="mx-auto max-w-[900px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs
      :items="[
        { label: 'حسابي', href: '/account' },
        { label: 'طلباتي', href: '/account/orders' },
        { label: orderNumber || 'الطلب' },
      ]"
    />

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">جاري التحميل…</div>

    <div v-else-if="error || !order" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">تعذّر تحميل تفاصيل الطلب</p>
      <p class="mb-4 text-sm text-mutedtext">ربما الطلب غير موجود أو أن الرابط غير صحيح.</p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
          @click="refresh()"
        >
          إعادة المحاولة
        </button>
        <NuxtLink
          to="/account/orders"
          class="rounded-full border border-line px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
        >
          كل الطلبات
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-navy">تفاصيل الطلب</h1>
          <p class="mt-1 text-sm text-mutedtext">
            رقم الطلب: <bdi dir="ltr" class="font-bold text-navy">{{ order.orderNumber }}</bdi>
            · {{ formatDate(order.createdAt) }}
          </p>
        </div>
        <StatusBadge :status="order.status" />
      </div>

      <section class="mb-6 rounded-2xl border border-line bg-white">
        <h2 class="border-b border-line px-5 py-4 text-base font-extrabold text-navy">المنتجات</h2>
        <ul class="divide-y divide-line">
          <li v-for="(item, index) in order.items" :key="index" class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p class="text-sm font-bold text-navy">{{ item.productTitleSnapshot }}</p>
              <p v-if="item.variantSnapshot" class="mt-0.5 text-xs text-mutedtext">{{ item.variantSnapshot }}</p>
              <p class="mt-0.5 text-xs text-mutedtext">الكمية: {{ item.quantity }}</p>
            </div>
            <span class="text-sm font-black text-navy">{{ formatBase(item.lineTotalCents) }}</span>
          </li>
        </ul>
        <dl class="flex flex-col gap-2 border-t border-line px-5 py-4 text-sm">
          <div class="flex items-center justify-between">
            <dt class="text-bodytext">الإجمالي الفرعي</dt>
            <dd class="font-bold text-navy">{{ formatBase(order.subtotalCents ?? order.totalCents) }}</dd>
          </div>
          <div v-if="order.shippingCents" class="flex items-center justify-between">
            <dt class="text-bodytext">الشحن</dt>
            <dd class="font-bold text-navy">{{ formatBase(order.shippingCents) }}</dd>
          </div>
          <div class="flex items-center justify-between border-t border-line pt-2">
            <dt class="font-bold text-navy">الإجمالي</dt>
            <dd class="text-lg font-black text-navy">{{ formatBase(order.totalCents) }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="order.isOwner" class="rounded-2xl border border-line bg-white p-5">
        <h2 class="mb-4 text-base font-extrabold text-navy">بيانات التوصيل</h2>
        <dl class="flex flex-col gap-2 text-sm">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-bodytext">الاسم</dt>
            <dd class="font-bold text-navy">{{ order.name }}</dd>
          </div>
          <div v-if="order.phone" class="flex items-center justify-between gap-3">
            <dt class="text-bodytext">الموبايل</dt>
            <dd class="font-bold text-navy" dir="ltr">{{ order.phone }}</dd>
          </div>
          <div v-if="order.governorate" class="flex items-center justify-between gap-3">
            <dt class="text-bodytext">المحافظة</dt>
            <dd class="font-bold text-navy">{{ order.governorate }}</dd>
          </div>
          <div v-if="order.addressLine" class="flex items-start justify-between gap-3">
            <dt class="shrink-0 text-bodytext">العنوان</dt>
            <dd class="text-end font-bold text-navy">{{ order.addressLine }}</dd>
          </div>
          <div v-if="order.notes" class="flex items-start justify-between gap-3">
            <dt class="shrink-0 text-bodytext">ملاحظات</dt>
            <dd class="text-end font-bold text-navy">{{ order.notes }}</dd>
          </div>
        </dl>
      </section>
    </template>
  </div>
</template>
