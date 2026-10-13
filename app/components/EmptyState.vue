<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    title: string
    hint?: string
    actionLabel?: string
    actionHref?: string
    icon?: Component
  }>(),
  { hint: undefined, actionLabel: undefined, actionHref: undefined, icon: undefined },
)
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center md:py-16">
    <span class="grid h-16 w-16 place-items-center rounded-full bg-surface text-mutedtext">
      <component :is="icon ?? Inbox" :size="28" aria-hidden="true" />
    </span>
    <h2 class="text-xl font-extrabold text-navy">{{ title }}</h2>
    <p v-if="hint" class="max-w-md text-sm leading-relaxed text-mutedtext">{{ hint }}</p>
    <NuxtLink
      v-if="actionLabel && actionHref"
      :to="actionHref"
      class="mt-2 rounded-full bg-navy px-7 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      {{ actionLabel }}
    </NuxtLink>
  </div>
</template>
