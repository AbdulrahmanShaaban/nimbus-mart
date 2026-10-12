<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    forId: string
    error?: string | null
    hint?: string
  }>(),
  { error: null, hint: undefined },
)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="forId" class="text-sm font-bold text-navy">{{ label }}</label>
    <slot />
    <p v-if="error" :id="`${forId}-error`" class="text-xs font-semibold text-red-600" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-xs text-mutedtext">{{ hint }}</p>
  </div>
</template>
