<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    max?: number
    disabled?: boolean
    ariaLabel?: string
  }>(),
  { max: 99, disabled: false, ariaLabel: 'الكمية' },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const maxQty = computed(() => Math.max(1, Math.min(99, props.max)))

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(maxQty.value, Math.max(1, Math.trunc(n)))
}

function increase() {
  if (props.disabled) return
  emit('update:modelValue', Math.min(props.modelValue + 1, maxQty.value))
}

function decrease() {
  if (props.disabled) return
  emit('update:modelValue', Math.max(1, props.modelValue - 1))
}

function onInputChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  const parsed = Number.parseInt(target.value, 10)
  emit('update:modelValue', clamp(parsed))
}
</script>

<template>
  <div
    class="inline-flex items-center overflow-hidden rounded-xl border border-line bg-white"
    role="group"
    :aria-label="ariaLabel"
  >
    <button
      type="button"
      class="grid h-9 w-9 shrink-0 place-items-center rounded-s-xl text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
      :disabled="disabled || modelValue <= 1"
      :aria-label="`إنقاص ${ariaLabel}`"
      @click="decrease"
    >
      <Minus :size="15" aria-hidden="true" />
    </button>
    <input
      :value="modelValue"
      type="number"
      inputmode="numeric"
      min="1"
      :max="maxQty"
      :disabled="disabled"
      :aria-label="ariaLabel"
      class="h-9 w-10 border-x border-line bg-transparent text-center text-sm font-bold text-navy focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-60"
      @change="onInputChange"
    >
    <button
      type="button"
      class="grid h-9 w-9 shrink-0 place-items-center rounded-e-xl text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
      :disabled="disabled || modelValue >= maxQty"
      :aria-label="`زيادة ${ariaLabel}`"
      @click="increase"
    >
      <Plus :size="15" aria-hidden="true" />
    </button>
  </div>
</template>
