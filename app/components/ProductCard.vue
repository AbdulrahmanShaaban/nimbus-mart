<script setup lang="ts">
import { Heart, Search, Check, TriangleAlert, Star } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { ProductCardDto } from '~/types/api'

const props = withDefaults(
  defineProps<{
    product: ProductCardDto
    initialWished?: boolean
  }>(),
  { initialWished: false },
)
const emit = defineEmits<{ wishedChange: [productId: string, inWishlist: boolean] }>()

const route = useRoute()
const { t } = useI18n()
const { pick } = useLocalized()
const { addItem } = useCart()

const productTitle = computed(() => pick(props.product.titleAr, props.product.titleEn))
const wishlistCount = useState<number>('nm-wishlist-count', () => 0)

type AddState = 'idle' | 'adding' | 'added' | 'error'

const addState = ref<AddState>('idle')
const wished = ref(props.initialWished)
const quickViewOpen = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | null = null

const inStock = computed(() => props.product.defaultVariantId !== null)

function statusOf(error: unknown): number | null {
  if (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof error.statusCode === 'number'
  ) {
    return error.statusCode
  }
  return null
}

function scheduleReset(state: AddState, delay: number) {
  if (resetTimer !== null) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    addState.value = 'idle'
  }, delay)
  addState.value = state
}

async function addToCart() {
  const variantId = props.product.defaultVariantId
  if (!variantId || addState.value === 'adding') return
  addState.value = 'adding'
  try {
    await addItem(variantId, 1)
    scheduleReset('added', 1500)
  } catch {
    scheduleReset('error', 2500)
  }
}

async function toggleWishlist() {
  try {
    const result = await $fetch<{ inWishlist: boolean }>('/api/wishlist', {
      method: 'POST',
      body: { productId: props.product.productId },
    })
    wished.value = result.inWishlist
    wishlistCount.value = Math.max(0, wishlistCount.value + (result.inWishlist ? 1 : -1))
    emit('wishedChange', props.product.productId, result.inWishlist)
  } catch (error) {
    if (statusOf(error) === 401) {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  }
}

onUnmounted(() => {
  if (resetTimer !== null) clearTimeout(resetTimer)
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col rounded-2xl border border-line bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(12,40,123,0.18)] md:p-3"
  >
    <div class="relative block aspect-[1/1.2] w-full overflow-hidden rounded-xl bg-white md:aspect-[1/1.1]">
      <img
        :src="product.image"
        :alt="productTitle"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-500 ease-out group-hover:scale-105 md:p-2"
      >

      <div
        class="absolute end-2 top-2 z-20 flex translate-x-2 flex-col gap-2 opacity-0 transition-all duration-300 focus-within:translate-x-0 focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none rtl:-translate-x-2 rtl:focus-within:translate-x-0 rtl:group-hover:translate-x-0"
      >
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl bg-white text-navy shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
          :aria-label="t('pc.quickView')"
          :title="t('pc.quickView')"
          @click="quickViewOpen = true"
        >
          <Search :size="17" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
          :class="wished ? 'text-red-500' : 'text-navy'"
          :aria-pressed="wished"
          :aria-label="wished ? t('pc.wishRemove') : t('pc.wishAdd')"
          @click="toggleWishlist"
        >
          <Heart :size="17" :fill="wished ? 'currentColor' : 'none'" aria-hidden="true" />
        </button>
      </div>

      <div class="absolute start-1.5 top-1.5 z-30 flex flex-col items-end gap-1 md:start-2 md:top-2 md:gap-1.5">
        <span
          v-if="product.discountPercent"
          class="rounded-full bg-gradient-to-br from-[#E3FB07] to-[#bcd400] px-1.5 py-0.5 text-[9px] font-black text-navy shadow-[0_4px_12px_rgba(189,212,0,0.5)] ring-1 ring-white/40 md:px-2.5 md:py-1 md:text-[11px]"
        ><bdi dir="ltr">-{{ product.discountPercent }}%</bdi></span>
        <span
          v-if="product.isNew"
          class="rounded-full bg-gradient-to-br from-navy to-[#1e40af] px-1.5 py-0.5 text-[8px] font-black tracking-wide text-white uppercase shadow-[0_4px_12px_rgba(12,40,123,0.4)] ring-1 ring-white/15 rtl:tracking-normal rtl:normal-case md:px-2.5 md:py-1 md:text-[9px]"
        >{{ t('pc.recentlyAdded') }}</span>
      </div>
    </div>

    <div class="flex flex-1 flex-col px-1 pb-1 pt-2.5">
      <NuxtLink
        :to="`/products/${product.slug}`"
        class="mb-0.5 line-clamp-1 text-[11px] font-bold text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand md:text-sm"
        :title="productTitle"
      >
        {{ productTitle }}
      </NuxtLink>

      <div class="mb-1.5 flex items-center gap-1" role="img" :aria-label="t('pc.noReviews')">
        <div class="flex items-center">
          <Star
            v-for="starIndex in 5"
            :key="starIndex"
            class="h-2.5 w-2.5 text-gray-200 md:h-3.5 md:w-3.5"
            aria-hidden="true"
          />
        </div>
        <span class="text-[10px] font-bold text-gray-400" dir="ltr">(0)</span>
      </div>

      <div class="mt-auto flex w-full flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <PriceBlock :price-cents="product.priceCents" :compare-at-cents="product.compareAtCents" size="sm" />
        <div
          v-if="product.colorHexes.length > 0"
          class="mb-0.5 flex flex-wrap items-center gap-1.5"
          role="img"
          :aria-label="t('pc.options')"
        >
          <span
            v-for="(hex, hexIndex) in product.colorHexes"
            :key="hex"
            class="h-4 w-4 rounded-full border shadow-sm transition-all hover:scale-110 md:h-5 md:w-5"
            :class="hexIndex === 0 ? 'border-transparent ring-2 ring-navy ring-offset-1' : 'border-gray-200'"
            :style="{ backgroundColor: hex }"
          />
        </div>
      </div>

      <button
        type="button"
        class="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-neon px-2 text-[13px] font-black text-brand-alt transition-all duration-300 hover:-translate-y-px hover:brightness-95 focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 md:h-12"
        :disabled="!inStock || addState === 'adding'"
        @click="addToCart"
      >
        <template v-if="addState === 'added'">
          <Check :size="16" aria-hidden="true" />
          {{ t('common.added') }}
        </template>
        <template v-else-if="addState === 'error'">
          <TriangleAlert :size="16" aria-hidden="true" />
          {{ t('pc.addFailed') }}
        </template>
        <template v-else-if="!inStock">
          {{ t('common.outOfStock') }}
        </template>
        <template v-else>
          {{ t('common.addToCart') }}
        </template>
      </button>
    </div>

    <QuickViewModal v-if="quickViewOpen" :slug="product.slug" @close="quickViewOpen = false" />
  </article>
</template>
