<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    priceCents: string
    compareAtCents?: string | null
    discountPercent?: number | null
    size?: 'sm' | 'md'
  }>(),
  { compareAtCents: null, discountPercent: null, size: 'md' },
)

const { formatBase } = useCurrency()

const current = computed(() => formatBase(props.priceCents))
const compare = computed(() => (props.compareAtCents ? formatBase(props.compareAtCents) : null))
</script>

<template>
  <div class="flex flex-wrap items-baseline gap-2">
    <span
      class="font-black text-brand"
      :class="size === 'sm' ? 'text-sm' : 'text-base'"
    >{{ current }}</span>
    <span v-if="compare" class="text-xs font-normal text-mutedtext line-through">{{ compare }}</span>
    <span
      v-if="discountPercent"
      class="rounded-full bg-brand px-2 py-0.5 text-[11px] font-black text-white"
    >خصم {{ discountPercent }}%</span>
  </div>
</template>
