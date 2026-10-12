<script setup lang="ts">
import { Search } from '@lucide/vue'
import { adminFetchMessage, adminFormatDate } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })
useHead({ title: 'العملاء — لوحة التحكم' })

interface UserListItem {
  id: string
  email: string
  name: string
  phone: string | null
  role: string
  createdAt: string
  ordersCount: number
}

interface UsersResponse {
  items: UserListItem[]
  total: number
  page: number
}

const q = ref('')
const roleFilter = ref('')
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

function onRoleChange() {
  page.value = 1
}

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  'admin-users-list',
  () =>
    requestFetch<UsersResponse>('/api/admin/users', {
      query: {
        q: debouncedQ.value || undefined,
        role: roleFilter.value || undefined,
        page: page.value,
        limit: 20,
      },
    }),
  { watch: [debouncedQ, roleFilter, page] },
)

const totalPages = computed(() => {
  if (!data.value) return 1
  return Math.max(1, Math.ceil(data.value.total / 20))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-navy">العملاء</h1>
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
          placeholder="ابحث بالاسم أو البريد أو الموبايل..."
          class="w-full rounded-lg border border-line bg-white px-3 py-2 pe-9 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          aria-label="بحث في العملاء"
          @input="onSearchInput"
        >
      </div>
      <select
        v-model="roleFilter"
        class="rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
        aria-label="تصفية بالدور"
        @change="onRoleChange"
      >
        <option value="">الكل</option>
        <option value="CUSTOMER">عملاء</option>
        <option value="ADMIN">مديرو</option>
      </select>
    </div>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      جارٍ تحميل العملاء...
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
        لا يوجد مستخدمون مطابقون.
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50">
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الاسم</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">البريد</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الموبايل</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الدور</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">تاريخ التسجيل</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">عدد الطلبات</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in data.items"
              :key="u.id"
              class="border-t border-line transition-colors hover:bg-surface/40"
            >
              <td class="px-4 py-3 font-semibold text-navy">{{ u.name }}</td>
              <td class="px-4 py-3" dir="ltr"><bdi>{{ u.email }}</bdi></td>
              <td class="px-4 py-3" dir="ltr"><bdi>{{ u.phone ?? '—' }}</bdi></td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="u.role === 'ADMIN' ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-700'"
                >
                  {{ u.role === 'ADMIN' ? 'مدير' : 'عميل' }}
                </span>
              </td>
              <td class="px-4 py-3 text-mutedtext">{{ adminFormatDate(u.createdAt) }}</td>
              <td class="px-4 py-3">{{ u.ordersCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-mutedtext">
          الإجمالي: {{ data.total }} مستخدم — صفحة {{ data.page }} من {{ totalPages }}
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
