<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { FreeMode } from 'swiper/modules'
import {
  ChevronLeft,
  ChevronRight,
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
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'
import type { Swiper as SwiperClass } from 'swiper/types'
import type { CategoryDto } from '~/types/api'

defineProps<{ categories: CategoryDto[] }>()

const { t, locale } = useI18n()
const { pick } = useLocalized()

const swiperInstance = ref<SwiperClass | null>(null)

function onSwiper(instance: SwiperClass) {
  swiperInstance.value = instance
}

function slidePrev() {
  swiperInstance.value?.slidePrev()
}

function slideNext() {
  swiperInstance.value?.slideNext()
}

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
  <div>
    <div class="mb-5 flex items-center justify-between gap-4">
      <h2 class="text-lg font-black text-navy md:text-2xl">{{ t('home.browseCategories') }}</h2>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/products"
          class="text-sm font-bold text-brand transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-brand"
        >
          {{ t('common.viewAll') }}
        </NuxtLink>
        <button
          type="button"
          class="hidden h-9 w-9 place-items-center rounded-full border border-line text-navy transition-colors hover:border-navy hover:bg-white focus-visible:outline-2 focus-visible:outline-brand md:grid"
          :aria-label="t('common.prevSlide')"
          @click="slidePrev"
        >
          <ChevronRight :size="17" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="hidden h-9 w-9 place-items-center rounded-full border border-line text-navy transition-colors hover:border-navy hover:bg-white focus-visible:outline-2 focus-visible:outline-brand md:grid"
          :aria-label="t('common.nextSlide')"
          @click="slideNext"
        >
          <ChevronLeft :size="17" aria-hidden="true" />
        </button>
      </div>
    </div>

    <Swiper
      :key="locale"
      :modules="[FreeMode]"
      :slides-per-view="'auto'"
      :space-between="20"
      :free-mode="{ sticky: false }"
      :breakpoints="{ 768: { spaceBetween: 32 } }"
      class="nm-cat-swiper !px-1 !py-1"
      @swiper="onSwiper"
    >
      <SwiperSlide v-for="category in categories" :key="category.slug" class="!w-auto">
        <NuxtLink
          :to="`/categories/${category.slug}`"
          class="group flex w-[104px] flex-col items-center gap-2.5 text-center focus-visible:outline-2 focus-visible:outline-brand md:w-[122px] md:gap-3"
        >
          <span
            class="relative flex h-[104px] w-[104px] items-center justify-center rounded-[18px] border border-transparent bg-white p-[9px] transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-navy/10 group-hover:bg-navy/[0.03] group-hover:shadow-[0_14px_30px_rgba(12,40,123,0.18)] md:h-[122px] md:w-[122px] md:rounded-[20px] md:p-[10px]"
          >
            <span class="flex h-full w-full items-center justify-center overflow-hidden rounded-[13px] bg-[#F6F7F9] md:rounded-[15px]">
              <img
                v-if="category.image"
                :src="category.image"
                :alt="pick(category.nameAr, category.nameEn)"
                loading="lazy"
                class="relative h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              >
              <component
                :is="iconFor(category.icon)"
                v-else
                :size="34"
                class="relative text-navy transition-transform duration-300 ease-out group-hover:scale-110"
                aria-hidden="true"
              />
              <span class="absolute inset-0 bg-navy/0 transition-colors duration-300 group-hover:bg-navy/10" aria-hidden="true" />
            </span>
          </span>
          <span class="line-clamp-2 text-xs font-semibold leading-snug text-navy transition-colors duration-300 group-hover:text-brand md:text-sm">
            {{ pick(category.nameAr, category.nameEn) }}
          </span>
        </NuxtLink>
      </SwiperSlide>
    </Swiper>
  </div>
</template>
