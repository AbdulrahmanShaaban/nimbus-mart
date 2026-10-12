<script setup lang="ts">
import { ShoppingBag, Heart, Eye, Check, TriangleAlert } from '@lucide/vue'
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
const { addItem } = useCart()
const wishlistCount = useState<number>('nm-wishlist-count', () => 0)

type AddState = 'idle' | 'adding' | 'added' | 'error'

const addState = ref<AddState>('idle')
const wished = ref(props.initialWished)
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
    class="group relative flex h-full flex-col rounded-2xl border border-[#EEEEEE] bg-white p-2 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(12,40,123,0.12)] md:p-3"
  >
    <div class="relative aspect-square overflow-hidden rounded-xl bg-[#FAFAFA]">
      <div class="absolute start-1.5 top-1.5 z-30 flex flex-col items-start gap-1.5">
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-xl bg-white text-navy shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
          :class="wished ? 'text-red-500' : ''"
          :aria-pressed="wished"
          :aria-label="wished ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'"
          @click="toggleWishlist"
        >
          <Heart :size="16" :fill="wished ? 'currentColor' : 'none'" aria-hidden="true" />
        </button>
        <span
          v-if="product.discountPercent"
          class="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-black text-white"
        >خصم {{ product.discountPercent }}%</span>
      </div>

      <div
        class="absolute end-1.5 top-1.5 z-20 flex -translate-x-1 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 focus-within:translate-x-0 focus-within:opacity-100"
      >
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl bg-white text-navy shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!inStock || addState === 'adding'"
          :aria-label="inStock ? 'أضف إلى السلة' : 'نفد المخزون'"
          @click="addToCart"
        >
          <Check v-if="addState === 'added'" :size="18" aria-hidden="true" />
          <ShoppingBag v-else :size="18" aria-hidden="true" />
        </button>
        <NuxtLink
          :to="`/products/${product.slug}`"
          class="grid h-10 w-10 place-items-center rounded-xl bg-white text-navy shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-navy hover:text-white focus-visible:outline-2 focus-visible:outline-brand"
          :aria-label="`عرض ${product.titleAr}`"
        >
          <Eye :size="18" aria-hidden="true" />
        </NuxtLink>
      </div>

      <img
        :src="product.image"
        :alt="product.titleAr"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-105"
      >
    </div>

    <div class="flex flex-1 flex-col gap-1.5 px-1 pb-1 pt-2.5">
      <span class="text-[11px] font-semibold text-mutedtext">{{ product.categoryNameAr }}</span>
      <NuxtLink
        :to="`/products/${product.slug}`"
        class="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
      >
        {{ product.titleAr }}
      </NuxtLink>

      <div class="mt-auto pt-1">
        <PriceBlock
          :price-cents="product.priceCents"
          :compare-at-cents="product.compareAtCents"
          size="sm"
        />
      </div>

      <button
        type="button"
        class="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-neon px-2 text-xs font-black text-brand-alt transition-all duration-300 hover:-translate-y-px hover:brightness-95 focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 md:h-12 md:text-sm"
        :disabled="!inStock || addState === 'adding'"
        @click="addToCart"
      >
        <template v-if="addState === 'added'">
          <Check :size="16" aria-hidden="true" />
          تمت الإضافة
        </template>
        <template v-else-if="addState === 'error'">
          <TriangleAlert :size="16" aria-hidden="true" />
          تعذّرت الإضافة
        </template>
        <template v-else-if="!inStock">
          نفد المخزون
        </template>
        <template v-else>
          <ShoppingBag :size="16" aria-hidden="true" />
          أضف إلى السلة
        </template>
      </button>
    </div>
  </article>
</template>
