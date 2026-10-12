<script setup lang="ts">
import {
  Shirt,
  Smartphone,
  Laptop,
  CookingPot,
  SprayCan,
  Watch,
  Lamp,
  Dumbbell,
  Footprints,
  Glasses,
  Sparkles,
} from '@lucide/vue'
import type { Component } from 'vue'
import type { CategoryDto } from '~/types/api'

defineProps<{ categories: CategoryDto[] }>()

const ICONS: Record<string, Component> = {
  shirt: Shirt,
  smartphone: Smartphone,
  laptop: Laptop,
  'cooking-pot': CookingPot,
  'spray-can': SprayCan,
  watch: Watch,
  lamp: Lamp,
  dumbbell: Dumbbell,
  footprints: Footprints,
  glasses: Glasses,
  sparkles: Sparkles,
}

function iconFor(name: string): Component {
  return ICONS[name] ?? Sparkles
}
</script>

<template>
  <ul class="nm-no-scrollbar flex items-start justify-start gap-x-5 gap-y-6 overflow-x-auto pb-2 md:grid md:grid-cols-6 md:justify-items-center md:gap-x-4 xl:grid-cols-12 xl:gap-x-2">
    <li v-for="category in categories" :key="category.slug" class="shrink-0">
      <NuxtLink
        :to="`/categories/${category.slug}`"
        class="group flex w-24 flex-col items-center gap-2 text-center focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span
          class="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-transparent bg-white p-2 transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-neon group-hover:shadow-[0_12px_28px_rgba(12,40,123,0.12)]"
        >
          <img
            v-if="category.image"
            :src="category.image"
            :alt="category.nameAr"
            loading="lazy"
            class="h-full w-full rounded-xl object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          >
          <component
            :is="iconFor(category.icon)"
            v-else
            :size="40"
            class="text-navy transition-transform duration-300 ease-out group-hover:scale-110"
            aria-hidden="true"
          />
        </span>
        <span class="text-sm font-bold leading-snug text-navy">{{ category.nameAr }}</span>
      </NuxtLink>
    </li>
  </ul>
</template>
