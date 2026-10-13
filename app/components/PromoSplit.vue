<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { PromoBlockDto } from '~/types/api'

const props = defineProps<{ promos: PromoBlockDto[] }>()

const { locale } = useI18n()
const { pick } = useLocalized()

const ArrowIcon = computed(() => (locale.value === 'en' ? ArrowRight : ArrowLeft))

const localizedPromos = computed(() =>
  props.promos.map((p) => ({
    ...p,
    heading: pick(p.headingAr, p.headingEn),
    body: pick(p.bodyAr, p.bodyEn),
    ctaLabel: pick(p.ctaLabelAr, p.ctaLabelEn),
  })),
)

function isAmber(gradient: string): boolean {
  const g = gradient.toUpperCase()
  return g.includes('AMBER') || g.includes('YELLOW') || g.includes('NEON')
}

function gradientClass(gradient: string): string {
  return isAmber(gradient)
    ? 'bg-[linear-gradient(115deg,#FDF1E5_0%,#FBE6D2_55%,#F7DCC4_100%)]'
    : 'bg-[linear-gradient(115deg,#F7F8FA_0%,#EDEFF3_55%,#E6E9EF_100%)]'
}
</script>

<template>
  <div class="grid gap-5" :class="localizedPromos.length > 1 ? 'md:grid-cols-2' : ''">
    <article
      v-for="(promo, index) in localizedPromos"
      :key="index"
      class="group relative flex items-center overflow-hidden rounded-2xl md:min-h-[360px]"
      :class="[
        gradientClass(promo.gradient),
        localizedPromos.length > 1 ? 'md:min-h-[505px]' : '',
      ]"
    >
      <div class="relative z-10 max-w-[560px] p-6 text-navy md:p-14">
        <h2 class="mb-3 text-[clamp(24px,3.4vw,44px)] font-extrabold leading-tight">
          {{ promo.heading }}
        </h2>
        <p class="mb-5 text-base leading-relaxed text-bodytext md:mb-6">
          {{ promo.body }}
        </p>
        <NuxtLink
          :to="promo.ctaHref"
          class="inline-flex items-center gap-2 rounded-xl bg-neon px-8 py-3.5 text-base font-black text-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(227,250,4,0.45)] focus-visible:outline-2 focus-visible:outline-brand"
        >
          {{ promo.ctaLabel }}
          <ArrowIcon :size="16" aria-hidden="true" />
        </NuxtLink>
      </div>
      <div
        v-if="promo.imageUrl"
        class="pointer-events-none absolute inset-y-0 end-0 hidden w-1/2 items-center justify-center p-6 md:flex"
      >
        <img
          :src="promo.imageUrl"
          :alt="promo.heading"
          loading="lazy"
          class="max-h-[80%] max-w-[80%] rounded-2xl bg-white object-contain p-3 shadow-[0_18px_40px_rgba(12,40,123,0.16)] transition-transform duration-500 ease-out group-hover:scale-105"
        >
      </div>
    </article>
  </div>
</template>
