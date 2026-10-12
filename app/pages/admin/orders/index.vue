<script setup lang="ts">
import { Search, Eye } from '@lucide/vue'
import { adminFetchMessage, adminFormatDate, adminStatusClass, adminStatusLabel } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })
useHead({ title: 'الطلبات — لوحة التحكم' })

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
      <h1 class="text-2xl font-extrabold text-navy">الطلبات</h1>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
        @click="refresh()"
      >
        تحديث
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-56 flex-1">
        <Search class="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedtext" :aria-hidden="true" />
        <input
          v-model="q"
          type="search"
          placeholder="ابحث برقم الطلب أو اسم العميل أو الموبايل..."
          class="w-full rounded-lg border border-line bg-white px-3 py-2 pe-9 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          aria-label="بحث في الطلبات"
          @input="onSearchInput"
        >
      </div>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
        aria-label="تصفية بالحالة"
        @change="onStatusChange"
      >
        <option value="">الكل</option>
        <option value="PLACED">تم الاستلام</option>
        <option value="PROCESSING">قيد التجهيز</option>
        <option value="SHIPPED">تم الشحن</option>
        <option value="DELIVERED">تم التوصيل</option>
        <option value="CANCELLED">ملغي</option>
      </select>
    </div>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      جارٍ تحميل الطلبات...
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700" role="alert">
      <p>{{ adminFetchMessage(error) }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        @click="refresh()"
      >
        إعادة المحاولة
      </button>
    </div>

    <template v-else-if="data">
      <div v-if="data.items.length === 0" class="rounded-xl border border-line bg-white px-4 py-10 text-center text-sm text-mutedtext">
        لا توجد طلبات مطابقة.
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50">
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">رقم الطلب</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">العميل</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الإجمالي</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">العناصر</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الحالة</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">التاريخ</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">إجراءات</th>
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
                  {{ adminStatusLabel(o.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-mutedtext">{{ adminFormatDate(o.createdAt) }}</td>
              <td class="px-4 py-3">
                <NuxtLink
                  :to="`/admin/orders/${o.orderNumber}`"
                  class="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-navy transition-colors hover:bg-surface/60"
                >
                  <Eye class="h-3.5 w-3.5" :aria-hidden="true" />
                  <span>عرض</span>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-mutedtext">
          الإجمالي: {{ data.total }} طلب — صفحة {{ data.page }} من {{ totalPages }}
        </p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60 disabled:opacity-40"
            :disabled="page <= 1"
            @click="page -= 1"
          >
            السابق
          </button>
          <button
            type="button"
            class="rounded-lg border border-line bg-white px-4 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60 disabled:opacity-40"
            :disabled="page >= totalPages"
            @click="page += 1"
          >
            التالي
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
