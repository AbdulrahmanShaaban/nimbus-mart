<script setup lang="ts">
import { ChevronDown, ChevronUp } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage, useAdminDateFormat } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t, te } = useI18n()
const { adminFormatDate } = useAdminDateFormat()

useHead(() => ({ title: `${t('audit.title')} — ${t('header.brand')}` }))

interface AuditItem {
  id: string
  action: string
  entity: string
  entityId: string | null
  actorEmail: string | null
  before: unknown
  after: unknown
  createdAt: string
}

interface AuditResponse {
  items: AuditItem[]
  total: number
  page: number
}

const page = ref(1)

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  'admin-audit-list',
  () => requestFetch<AuditResponse>('/api/admin/audit', { query: { page: page.value, limit: 30 } }),
  { watch: [page] },
)

const totalPages = computed(() => {
  if (!data.value) return 1
  return Math.max(1, Math.ceil(data.value.total / 30))
})

const expanded = ref<Record<string, boolean>>({})

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id]
}

function pretty(v: unknown): string {
  if (v == null) return '—'
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

function entityLabel(entity: string): string {
  const key = `audit.entities.${entity}`
  return te(key) ? t(key) : entity
}

function actionLabel(action: string): string {
  const key = `audit.actions.${action}`
  return te(key) ? t(key) : action
}

function shortId(id: string | null): string {
  if (!id) return '—'
  return id.length > 10 ? `${id.slice(0, 10)}…` : id
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold text-navy">{{ t('audit.title') }}</h1>
      <button
        type="button"
        class="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
        @click="refresh()"
      >
        {{ t('audit.refresh') }}
      </button>
    </div>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      {{ t('audit.loading') }}
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
        {{ t('audit.empty') }}
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-line bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50">
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('audit.date') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('audit.action') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('audit.entity') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('audit.actor') }}</th>
              <th class="px-4 py-3 text-start text-xs font-semibold text-mutedtext">{{ t('audit.view') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="a in data.items" :key="a.id">
              <tr class="border-t border-line transition-colors hover:bg-surface/40">
                <td class="px-4 py-3 text-mutedtext">{{ adminFormatDate(a.createdAt, true) }}</td>
                <td class="px-4 py-3 font-semibold text-navy">{{ actionLabel(a.action) }}</td>
                <td class="px-4 py-3">
                  <p class="text-navy">{{ entityLabel(a.entity) }}</p>
                  <p class="text-xs text-mutedtext" dir="ltr">{{ shortId(a.entityId) }}</p>
                </td>
                <td class="px-4 py-3">
                  <bdi dir="ltr">{{ a.actorEmail ?? t('audit.system') }}</bdi>
                </td>
                <td class="px-4 py-3">
                  <button
                    type="button"
                    class="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-navy transition-colors hover:bg-surface/60"
                    :aria-expanded="expanded[a.id] === true"
                    @click="toggle(a.id)"
                  >
                    <ChevronDown v-if="expanded[a.id] !== true" class="h-3.5 w-3.5" :aria-hidden="true" />
                    <ChevronUp v-else class="h-3.5 w-3.5" :aria-hidden="true" />
                    <span>{{ expanded[a.id] === true ? t('audit.hideDetails') : t('audit.showDetails') }}</span>
                  </button>
                </td>
              </tr>
              <tr v-if="expanded[a.id] === true" class="border-t border-line bg-surface/30">
                <td colspan="5" class="px-4 py-3">
                  <div class="grid gap-3 lg:grid-cols-2">
                    <div>
                      <p class="mb-1 text-xs font-semibold text-mutedtext">{{ t('audit.before') }}</p>
                      <pre dir="ltr" class="max-h-64 overflow-auto rounded-lg border border-line bg-white p-3 text-xs text-navy">{{ pretty(a.before) }}</pre>
                    </div>
                    <div>
                      <p class="mb-1 text-xs font-semibold text-mutedtext">{{ t('audit.after') }}</p>
                      <pre dir="ltr" class="max-h-64 overflow-auto rounded-lg border border-line bg-white p-3 text-xs text-navy">{{ pretty(a.after) }}</pre>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-mutedtext">
          {{ t('audit.summary', { total: data.total, page: data.page, pages: totalPages }) }}
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
