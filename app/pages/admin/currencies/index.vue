<script setup lang="ts">
import { Save } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage, useAdminDateFormat } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()
const { adminFormatDate } = useAdminDateFormat()

useHead(() => ({ title: `${t('currencies.title')} — ${t('header.brand')}` }))

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
      text: t('currencies.invalidRate', { code: r.code }),
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
    banner.value = { type: 'ok', text: t('currencies.saved', { code: r.code }) }
    await refresh()
  } catch (e) {
    banner.value = { type: 'err', text: adminFetchMessage(e, t('common.operationFailed')) }
    await refresh()
  } finally {
    savingCode.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-navy">{{ t('currencies.title') }}</h1>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
        @click="refresh()"
      >
        {{ t('currencies.refresh') }}
      </button>
    </div>

    <p class="rounded-lg border border-line bg-white px-4 py-3 text-sm text-mutedtext">
      {{ t('currencies.info') }}
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
      {{ t('currencies.loading') }}
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

    <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-surface/50">
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.currency') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.rate') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.symbol') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.position') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.decimals') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.enabled') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.base') }}</th>
            <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('currencies.updatedAt') }}</th>
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
                :aria-label="t('currencies.rateAria', { code: r.code })"
              >
            </td>
            <td class="px-4 py-3">
              <input
                v-model="r.symbol"
                type="text"
                dir="ltr"
                maxlength="6"
                class="w-20 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                :aria-label="t('currencies.symbolAria', { code: r.code })"
              >
            </td>
            <td class="px-4 py-3">
              <select
                v-model="r.position"
                class="rounded-lg border border-line bg-white px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                :aria-label="t('currencies.positionAria', { code: r.code })"
              >
                <option value="BEFORE">{{ t('currencies.before') }}</option>
                <option value="AFTER">{{ t('currencies.after') }}</option>
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
                :aria-label="t('currencies.decimalsAria', { code: r.code })"
              >
            </td>
            <td class="px-4 py-3">
              <input
                v-model="r.enabled"
                type="checkbox"
                class="h-4 w-4 rounded border-line accent-brand"
                :aria-label="t('currencies.enableAria', { code: r.code })"
              >
            </td>
            <td class="px-4 py-3">
              <input
                :checked="r.isBase"
                type="radio"
                name="base-currency"
                class="h-4 w-4 border-line accent-brand"
                :aria-label="t('currencies.baseAria', { code: r.code })"
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
                <span>{{ savingCode === r.code ? t('currencies.saving') : t('common.save') }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
