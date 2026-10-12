<script setup lang="ts">
import { Pencil, Trash, Plus, Search, Package } from '@lucide/vue'
import { adminFetchMessage, adminStatusClass, adminStatusLabel } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })
useHead({ title: 'المنتجات — لوحة التحكم' })

interface ProductListItem {
  id: string
  slug: string
  titleAr: string
  titleEn: string | null
  priceCents: string
  compareAtCents: string | null
  status: string
  categoryName: string
  image: string | null
  stockTotal: number
  variantsCount: number
}

interface ProductsResponse {
  items: ProductListItem[]
  total: number
  page: number
}

const { formatBase } = useCurrency()

const q = ref('')
const statusFilter = ref('')
const page = ref(1)
const debouncedQ = ref('')
const banner = ref<{ type: 'ok' | 'err'; text: string } | null>(null)
const deletingId = ref<string | null>(null)

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
  'admin-products-list',
  () =>
    requestFetch<ProductsResponse>('/api/admin/products', {
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

async function onDelete(p: ProductListItem) {
  if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return
  deletingId.value = p.id
  banner.value = null
  try {
    await $fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
    banner.value = { type: 'ok', text: `تم حذف المنتج «${p.titleAr}».` }
    await refresh()
  } catch (e) {
    banner.value = { type: 'err', text: adminFetchMessage(e) }
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-navy">المنتجات</h1>
      <NuxtLink
        to="/admin/products/new"
        class="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-deep"
      >
        <Plus class="h-4 w-4" :aria-hidden="true" />
        <span>منتج جديد</span>
      </NuxtLink>
    </div>

    <div
      v-if="banner"
      class="rounded-lg px-4 py-3 text-sm"
      :class="banner.type === 'ok' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'"
      role="status"
    >
      {{ banner.text }}
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-56 flex-1">
        <Search class="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedtext" :aria-hidden="true" />
        <input
          v-model="q"
          type="search"
          placeholder="ابحث بالعنوان أو الرابط..."
          class="w-full rounded-lg border border-line bg-white px-3 py-2 pe-9 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          aria-label="بحث في المنتجات"
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
        <option value="ACTIVE">نشط</option>
        <option value="DRAFT">مسودة</option>
        <option value="ARCHIVED">مؤرشف</option>
      </select>
    </div>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      جارٍ تحميل المنتجات...
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
        لا توجد منتجات مطابقة.
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50">
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">المنتج</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">التصنيف</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">السعر</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">المخزون</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الحالة</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in data.items"
              :key="p.id"
              class="border-t border-line transition-colors hover:bg-surface/40"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <img
                    v-if="p.image"
                    :src="p.image"
                    :alt="p.titleAr"
                    loading="lazy"
                    class="h-12 w-12 shrink-0 rounded-lg border border-line object-cover"
                  >
                  <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface/60 text-mutedtext">
                    <Package class="h-5 w-5" :aria-hidden="true" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-navy">{{ p.titleAr }}</p>
                    <p class="truncate text-xs text-mutedtext" dir="ltr">{{ p.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">{{ p.categoryName }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ formatBase(p.priceCents) }}</td>
              <td class="px-4 py-3">
                <span :class="p.stockTotal <= 3 ? 'font-semibold text-red-600' : 'text-navy'">{{ p.stockTotal }}</span>
                <span class="text-xs text-mutedtext"> ({{ p.variantsCount }} متغير)</span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="adminStatusClass(p.status)">
                  {{ adminStatusLabel(p.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <NuxtLink
                    :to="`/admin/products/${p.id}`"
                    class="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-navy transition-colors hover:bg-surface/60"
                  >
                    <Pencil class="h-3.5 w-3.5" :aria-hidden="true" />
                    <span>تعديل</span>
                  </NuxtLink>
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    :disabled="deletingId === p.id"
                    @click="onDelete(p)"
                  >
                    <Trash class="h-3.5 w-3.5" :aria-hidden="true" />
                    <span>{{ deletingId === p.id ? 'جارٍ الحذف...' : 'حذف' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-mutedtext">
          الإجمالي: {{ data.total }} منتج — صفحة {{ data.page }} من {{ totalPages }}
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
