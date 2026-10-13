<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OrderStatus } from '~/types/api'

const props = defineProps<{ status: OrderStatus | string }>()

const { t, te } = useI18n()

const STATUS_CLS: Record<string, string> = {
  PLACED: 'bg-brand/10 text-brand',
  PROCESSING: 'bg-amber-100 text-amber-800',
  SHIPPED: 'bg-sky-100 text-sky-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-700',
}

const entry = computed(() => {
  const key = `status.${props.status}`
  const label = te(key) ? t(key) : props.status
  return { label, cls: STATUS_CLS[props.status] ?? 'bg-surface text-navy' }
})
</script>

<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold" :class="entry.cls">
    {{ entry.label }}
  </span>
</template>
