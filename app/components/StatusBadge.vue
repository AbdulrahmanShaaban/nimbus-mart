<script setup lang="ts">
import type { OrderStatus } from '~/types/api'

const props = defineProps<{ status: OrderStatus | string }>()

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PLACED: { label: 'تم الطلب', cls: 'bg-brand/10 text-brand' },
  PROCESSING: { label: 'قيد التجهيز', cls: 'bg-amber-100 text-amber-800' },
  SHIPPED: { label: 'تم الشحن', cls: 'bg-sky-100 text-sky-800' },
  DELIVERED: { label: 'تم التسليم', cls: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { label: 'ملغي', cls: 'bg-red-100 text-red-700' },
}

const entry = computed(
  () => STATUS_MAP[props.status] ?? { label: props.status, cls: 'bg-surface text-navy' },
)
</script>

<template>
  <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold" :class="entry.cls">
    {{ entry.label }}
  </span>
</template>
