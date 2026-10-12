<script setup lang="ts">
import { Save } from '@lucide/vue'
import { adminFetchMessage, adminFormatDate } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })
useHead({ title: 'العملات — لوحة التحكم' })

interface CurrencyRow {
  code: string
  rate: string
  symbol: string
  position: 'BEFORE' | 'AFTER'
  decimals: number
  roundingStepCents: string | null
  enabled: boolean
  isBase: boolean
  updatedAt: string
}

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData('admin-currencies', () =>
  requestFetch<{ items: CurrencyRow[] }>('/api/admin/currencies'),
)

const rows = ref<CurrencyRow[]>([])
watch(
  data,
  (d) => {
    rows.value = (d?.items ?? []).map((r) => ({ ...r }))
  },
  { immediate: true },
)

const savingCode = ref<string | null>(null)
const banner = ref<{ type: 'ok' | 'err'; text: string } | null>(null)
const ratePattern = /^\d+(\.\d{1,8})$/

function pickBase(r: CurrencyRow) {
  for (const row of rows.value) {
    row.isBase = row.code === r.code
  }
}

async function saveRow(r: CurrencyRow) {
  if (!ratePattern.test(r.rate)) {
    banner.value = {
      type: 'err',
      text: `سعر العملة ${r.code} غير صالح — استخدم رقمًا عشريًا حتى 8 خانات.`,
    }
    return
  }
  savingCode.value = r.code
  banner.value = null
  try {
    await $fetch(`/api/admin/currencies/${r.code}`, {
      method: 'PATCH',
      body: {
        rate: r.rate,
        symbol: r.symbol,
        position: r.position,
        decimals: Math.min(4, Math.max(0, Math.trunc(r.decimals))),
        enabled: r.enabled,
        isBase: r.isBase,
      },
    })
    banner.value = { type: 'ok', text: `تم حفظ العملة ${r.code}.` }
    await refresh()
  } catch (e) {
    banner.value = { type: 'err', text: adminFetchMessage(e) }
    await refresh()
  } finally {
    savingCode.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-navy">العملات</h1>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
        @click="refresh()"
      >
        تحديث
      </button>
    </div>

    <p class="rounded-lg border border-line bg-white px-4 py-3 text-sm text-mutedtext">
      الأسعار هي قيمة العملة مقابل 1 جنيه مصري (EGP) — العملة الأساسية. لا يمكن إلغاء الأساسية بدون بديل.
    </p>

    <div
      v-if="banner"
      class="rounded-lg px-4 py-3 text-sm"
      :class="banner.type === 'ok' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'"
      role="status"
    >
      {{ banner.text }}
    </div>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      جارٍ تحميل العملات...
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

    <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-surface/50">
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">العملة</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">السعر</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الرمز</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الموضع</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">الخانات العشرية</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">مفعّل</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">أساسية</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">آخر تحديث</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.code"
            class="border-t border-line transition-colors hover:bg-surface/40"
          >
            <td class="px-4 py-3">
              <p class="font-bold text-navy" dir="ltr">{{ r.code }}</p>
              <p class="text-xs text-mutedtext">{{ r.symbol }}</p>
            </td>
            <td class="px-4 py-3">
              <input
                v-model="r.rate"
                type="text"
                dir="ltr"
                inputmode="decimal"
                class="w-32 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                :aria-label="`سعر ${r.code}`"
              >
            </td>
            <td class="px-4 py-3">
              <input
                v-model="r.symbol"
                type="text"
                dir="ltr"
                maxlength="6"
                class="w-20 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                :aria-label="`رمز ${r.code}`"
              >
            </td>
            <td class="px-4 py-3">
              <select
                v-model="r.position"
                class="rounded-lg border border-line bg-white px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                :aria-label="`موضع رمز ${r.code}`"
              >
                <option value="BEFORE">قبل</option>
                <option value="AFTER">بعد</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <input
                v-model.number="r.decimals"
                type="number"
                min="0"
                max="4"
                step="1"
                dir="ltr"
                class="w-20 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                :aria-label="`خانات ${r.code}`"
              >
            </td>
            <td class="px-4 py-3">
              <input
                v-model="r.enabled"
                type="checkbox"
                class="h-4 w-4 rounded border-line accent-brand"
                :aria-label="`تفعيل ${r.code}`"
              >
            </td>
            <td class="px-4 py-3">
              <input
                :checked="r.isBase"
                type="radio"
                name="base-currency"
                class="h-4 w-4 border-line accent-brand"
                :aria-label="`جعل ${r.code} العملة الأساسية`"
                @change="pickBase(r)"
              >
            </td>
            <td class="px-4 py-3 text-xs text-mutedtext">{{ adminFormatDate(r.updatedAt, true) }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
                :disabled="savingCode === r.code"
                @click="saveRow(r)"
              >
                <Save class="h-3.5 w-3.5" :aria-hidden="true" />
                <span>{{ savingCode === r.code ? 'جارٍ الحفظ...' : 'حفظ' }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
