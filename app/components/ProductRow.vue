<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { Swiper as SwiperClass } from 'swiper/types'
import type { ProductCardDto } from '~/types/api'

const props = withDefaults(
  defineProps<{
    items: ProductCardDto[]
    autoplay?: boolean
  }>(),
  { autoplay: false },
)

const swiperInstance = ref<SwiperClass | null>(null)
const atStart = ref(true)
const atEnd = ref(true)

const loopEnabled = computed(() => props.items.length >= 8)

const canPrev = computed(() => loopEnabled.value || !atStart.value)
const canNext = computed(() => loopEnabled.value || !atEnd.value)

function onSwiper(instance: SwiperClass) {
  swiperInstance.value = instance
  atStart.value = instance.isBeginning
  atEnd.value = instance.isEnd
}

function onSlideChange(instance: SwiperClass) {
  atStart.value = instance.isBeginning
  atEnd.value = instance.isEnd
}

function slidePrev() {
  swiperInstance.value?.slidePrev()
}

function slideNext() {
  swiperInstance.value?.slideNext()
}
</script>

<template>
  <div class="relative">
    <Swiper
      :modules="[Autoplay]"
      :slides-per-view="2"
      :space-between="12"
      :breakpoints="{ 640: { slidesPerView: 3, spaceBetween: 16 }, 1024: { slidesPerView: 4, spaceBetween: 20 }, 1536: { slidesPerView: 5, spaceBetween: 20 } }"
      :loop="loopEnabled"
      :speed="300"
      :autoplay="autoplay ? { delay: 3000, disableOnInteraction: false } : false"
      class="nm-product-row py-1"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <SwiperSlide v-for="item in items" :key="item.productId">
        <ProductCard :product="item" />
      </SwiperSlide>
    </Swiper>

    <button
      type="button"
      class="nm-row-arrow absolute start-0 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-neon focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canPrev"
      aria-label="السابق"
      @click="slidePrev"
    >
      <ChevronRight :size="18" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="nm-row-arrow absolute end-0 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-neon focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!canNext"
      aria-label="التالي"
      @click="slideNext"
    >
      <ChevronLeft :size="18" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.nm-product-row :deep(.swiper-slide) {
  height: auto;
}
</style>
