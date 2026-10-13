<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { HomeContentDto, ProductCardDto } from '~/types/api'

const { t } = useI18n()

useHead(() => ({ title: `${t('header.brand')} — ${t('home.tagline')}` }))

const { data, pending, error, refresh } = await useAsyncData(
  'home',
  () => $fetch<HomeContentDto>('/api/content/home'),
)

const content = computed(() => data.value)

type TabKey = 'newest' | 'featured' | 'best'

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'newest', labelKey: 'home.tabNewest' },
  { key: 'featured', labelKey: 'home.tabFeatured' },
  { key: 'best', labelKey: 'home.tabBest' },
]

const activeTab = ref<TabKey>('newest')

const tabItems = computed<ProductCardDto[]>(() => {
  const c = content.value
  if (!c) return []
  if (activeTab.value === 'featured') return c.featured
  if (activeTab.value === 'best') return c.bestSellers.length > 0 ? c.bestSellers : c.featured
  return c.newest
})

const kitchenPromo = computed(() => content.value?.promo ?? null)
const summerPromo = computed(() => content.value?.promoSecond ?? null)
</script>

<template>
  <div>
    <div v-if="pending" class="mx-auto max-w-[1330px] px-4 py-10" aria-live="polite">
      <p class="mb-4 text-sm text-mutedtext">{{ t('common.loading') }}</p>
      <LoadingSkeleton :count="8" />
    </div>

    <div
      v-else-if="error || !content"
      class="mx-auto max-w-[1330px] px-4 py-16 text-center"
      role="alert"
    >
      <p class="mb-1 text-lg font-bold text-navy">{{ t('home.errorTitle') }}</p>
      <p class="mb-4 text-sm text-mutedtext">{{ t('home.errorHint') }}</p>
      <button
        type="button"
        class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <template v-else>
      <HeroSwiper v-if="content.heroSlides.length > 0" :slides="content.heroSlides" />

      <section class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-10">
        <CategoryGrid :categories="content.categories" />
      </section>

      <section
        v-if="tabItems.length > 0"
        class="mx-auto max-w-[1330px] px-4 pb-10 md:px-6 md:pb-14"
      >
        <SectionHeader :title="t('home.recommended')" center />
        <div
          class="mb-7 flex flex-wrap items-center justify-center gap-6 md:gap-9"
          role="tablist"
          :aria-label="t('home.productGroups')"
        >
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            role="tab"
            class="border-b-2 pb-1.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand md:text-base"
            :class="
              activeTab === tab.key
                ? 'border-brand text-brand'
                : 'border-transparent text-mutedtext hover:text-navy'
            "
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
          >
            {{ t(tab.labelKey) }}
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          <ProductCard v-for="item in tabItems" :key="item.productId" :product="item" />
        </div>
      </section>

      <section
        v-if="kitchenPromo"
        class="mx-auto max-w-[1330px] px-4 pb-10 md:px-6 md:pb-14"
      >
        <PromoSplit :promos="[kitchenPromo]" />
      </section>

      <section
        v-if="content.featured.length > 0"
        class="mx-auto max-w-[1330px] px-4 pb-10 md:px-6 md:pb-14"
      >
        <SectionHeader :title="t('home.curated')" center />
        <ProductRow :items="content.featured" autoplay />
      </section>

      <section
        v-if="summerPromo"
        class="mx-auto max-w-[1330px] px-4 pb-10 md:px-6 md:pb-14"
      >
        <PromoSplit :promos="[summerPromo]" />
      </section>

      <section
        v-if="content.sale.length > 0"
        class="mx-auto max-w-[1330px] px-4 pb-12 md:px-6 md:pb-16"
      >
        <CountdownDeal class="mb-5" />
        <ProductRow :items="content.sale" />
      </section>
    </template>
  </div>
</template>
