<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import { ArrowLeft, ChevronLeft, ChevronRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { Swiper as SwiperClass } from 'swiper/types'
import type { HeroSlideDto } from '~/types/api'

const props = defineProps<{ slides: HeroSlideDto[] }>()

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

const localizedSlides = computed(() =>
  props.slides.map((s) => ({
    ...s,
    title: pick(s.titleAr, s.titleEn),
    subtitle: pick(s.subtitleAr, s.subtitleEn),
    ctaLabel: pick(s.ctaLabelAr, s.ctaLabelEn),
  })),
)
</script>

<template>
  <section class="relative h-[450px] w-full overflow-hidden md:h-[491px]">
    <Swiper
      :key="locale"
      :modules="[Autoplay, Pagination]"
      :autoplay="{ delay: 4000, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :loop="localizedSlides.length > 1"
      :speed="300"
      class="nm-hero-swiper h-full"
      @swiper="onSwiper"
    >
      <SwiperSlide v-for="(slide, slideIndex) in localizedSlides" :key="slide.id" class="h-full">
        <div class="nm-hero-light relative h-full w-full overflow-hidden">
          <span
            class="pointer-events-none absolute end-[8%] top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full bg-neon/30 blur-3xl md:h-[420px] md:w-[420px]"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute inset-y-0 end-[6%] flex items-center justify-end max-md:inset-x-0 max-md:bottom-[-2%] max-md:top-auto max-md:h-[50%] max-md:justify-center"
          >
            <img
              :src="slide.imageUrl"
              alt=""
              :loading="slideIndex === 0 ? 'eager' : 'lazy'"
              :fetchpriority="slideIndex === 0 ? 'high' : 'auto'"
              :decoding="slideIndex === 0 ? 'sync' : 'async'"
              class="h-full max-h-[82%] w-auto max-w-[46%] object-contain drop-shadow-[0_24px_44px_rgba(12,40,123,0.28)] max-md:max-w-[70%]"
            >
          </div>
          <div
            class="relative z-10 flex h-full max-w-[640px] flex-col items-start justify-center px-6 text-navy max-md:justify-start max-md:pt-10 md:px-[8%]"
          >
            <h1 class="mb-3 text-[clamp(28px,4.5vw,56px)] font-extrabold leading-[1.25] md:mb-4 md:leading-[1.3]">
              {{ slide.title }}
            </h1>
            <p class="mb-5 max-w-[480px] text-sm font-medium leading-relaxed text-bodytext md:mb-6 md:text-lg">
              {{ slide.subtitle }}
            </p>
            <NuxtLink
              :to="slide.ctaHref"
              class="inline-flex items-center gap-2 rounded-xl bg-neon px-6 py-3 text-sm font-black text-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(227,250,4,0.45)] focus-visible:outline-2 focus-visible:outline-brand md:px-8 md:py-3.5 md:text-base"
            >
              {{ slide.ctaLabel }}
              <ArrowLeft :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <button
      v-if="localizedSlides.length > 1"
      type="button"
      class="nm-hero-arrow absolute start-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#555555] shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 hover:text-navy active:scale-95 focus-visible:outline-2 focus-visible:outline-brand md:start-6 md:grid md:h-14 md:w-14"
      :aria-label="t('common.prevSlide')"
      @click="slidePrev"
    >
      <ChevronRight :size="24" class="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
    </button>
    <button
      v-if="localizedSlides.length > 1"
      type="button"
      class="nm-hero-arrow absolute end-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#555555] shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 hover:text-navy active:scale-95 focus-visible:outline-2 focus-visible:outline-brand md:end-6 md:grid md:h-14 md:w-14"
      :aria-label="t('common.nextSlide')"
      @click="slideNext"
    >
      <ChevronLeft :size="24" class="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.nm-hero-light {
  background: linear-gradient(105deg, #f8f9fb 0%, #eef0f4 55%, #e5e8ee 100%);
}

.nm-hero-swiper :deep(.swiper-pagination-bullet) {
  width: 10px;
  height: 10px;
  background: #0c287b;
  opacity: 0.22;
}

.nm-hero-swiper :deep(.swiper-pagination-bullet-active) {
  background: #0c287b;
  opacity: 1;
}

.nm-hero-swiper :deep(.swiper-pagination) {
  bottom: 24px;
}
</style>
