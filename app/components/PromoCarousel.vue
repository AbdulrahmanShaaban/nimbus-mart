<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination } from 'swiper/modules'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { Swiper as SwiperClass } from 'swiper/types'
import type { PromoBlockDto } from '~/types/api'

const props = defineProps<{ promos: PromoBlockDto[] }>()

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

const ArrowIcon = computed(() => (locale.value === 'en' ? ArrowRight : ArrowLeft))

function isAmber(gradient: string): boolean {
  const g = gradient.toUpperCase()
  return g.includes('AMBER') || g.includes('YELLOW') || g.includes('NEON')
}

function gradientClass(gradient: string): string {
  return isAmber(gradient)
    ? 'bg-[linear-gradient(115deg,#FDF1E5_0%,#FBE6D2_55%,#F7DCC4_100%)]'
    : 'bg-[linear-gradient(115deg,#F7F8FA_0%,#EDEFF3_55%,#E6E9EF_100%)]'
}

const items = computed(() =>
  props.promos.map((promo) => ({
    ...promo,
    heading: pick(promo.headingAr, promo.headingEn),
    body: pick(promo.bodyAr, promo.bodyEn),
    ctaLabel: pick(promo.ctaLabelAr, promo.ctaLabelEn),
    surfaceClass: gradientClass(promo.gradient),
  })),
)
</script>

<template>
  <section v-if="items.length > 0" :aria-label="t('home.promoAria')" class="relative">
    <Swiper
      :key="locale"
      :modules="[Autoplay, Pagination]"
      :autoplay="{ delay: 5200, disableOnInteraction: false }"
      :pagination="{ clickable: true }"
      :loop="items.length > 1"
      :speed="450"
      class="nm-promo-swiper overflow-hidden rounded-2xl"
      @swiper="onSwiper"
    >
      <SwiperSlide v-for="item in items" :key="item.ctaHref + item.heading">
        <NuxtLink
          :to="item.ctaHref"
          class="group relative flex min-h-[230px] items-center overflow-hidden focus-visible:outline-2 focus-visible:outline-brand md:min-h-[380px]"
          :class="item.surfaceClass"
        >
          <div class="relative z-10 max-w-[560px] p-6 text-navy md:ps-24 md:pe-14 md:py-14">
            <h2 class="mb-3 text-[clamp(24px,3.4vw,44px)] font-extrabold leading-tight">
              {{ item.heading }}
            </h2>
            <p class="mb-5 text-base leading-relaxed text-bodytext md:mb-6">
              {{ item.body }}
            </p>
            <span
              class="inline-flex items-center gap-2 rounded-xl bg-neon px-8 py-3.5 text-base font-black text-navy shadow-[0_6px_18px_rgba(227,250,4,0.35)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_rgba(227,250,4,0.5)]"
            >
              {{ item.ctaLabel }}
              <ArrowIcon :size="16" aria-hidden="true" />
            </span>
          </div>
          <div
            v-if="item.imageUrl"
            class="pointer-events-none absolute inset-y-0 end-0 hidden w-1/2 items-center justify-center p-6 md:flex"
          >
            <img
              :src="item.imageUrl"
              :alt="item.heading"
              loading="lazy"
              decoding="async"
              class="max-h-[80%] max-w-[80%] rounded-2xl bg-white object-contain p-3 shadow-[0_18px_40px_rgba(12,40,123,0.16)] transition-transform duration-500 ease-out group-hover:scale-105"
            >
          </div>
        </NuxtLink>
      </SwiperSlide>
    </Swiper>

    <button
      v-if="items.length > 1"
      type="button"
      class="absolute start-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#555555] shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 hover:text-navy active:scale-95 focus-visible:outline-2 focus-visible:outline-brand md:start-6 md:grid md:h-14 md:w-14"
      :aria-label="t('common.prevSlide')"
      @click="slidePrev"
    >
      <ChevronRight :size="22" aria-hidden="true" />
    </button>
    <button
      v-if="items.length > 1"
      type="button"
      class="absolute end-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#555555] shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 hover:text-navy active:scale-95 focus-visible:outline-2 focus-visible:outline-brand md:end-6 md:grid md:h-14 md:w-14"
      :aria-label="t('common.nextSlide')"
      @click="slideNext"
    >
      <ChevronLeft :size="22" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.nm-promo-swiper :deep(.swiper-pagination-bullet) {
  width: 10px;
  height: 10px;
  background: transparent;
  border: 2px solid rgba(12, 40, 123, 0.35);
  opacity: 1;
  transition: all 0.3s;
}

.nm-promo-swiper :deep(.swiper-pagination-bullet-active) {
  background: #0c287b;
  border-color: #0c287b;
  transform: scale(1.1);
}

.nm-promo-swiper :deep(.swiper-pagination) {
  bottom: 12px;
}
</style>
