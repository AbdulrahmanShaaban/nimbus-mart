<script setup lang="ts">
import { ShoppingBag, Check, TriangleAlert, Heart, ShieldCheck, Truck, RotateCcw } from '@lucide/vue'
import type { ProductDetailDto } from '~/types/api'

const route = useRoute()
const slug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : ''))

const { data, pending, error, refresh } = await useAsyncData(
  () => `product:${slug.value}`,
  () => $fetch<ProductDetailDto>(`/api/products/${slug.value}`),
  { watch: [slug] },
)

const { formatBase } = useCurrency()
const { addItem } = useCart()
const wishlistCount = useState<number>('nm-wishlist-count', () => 0)

const product = computed(() => data.value)

useHead({
  title: computed(() => (product.value ? `${product.value.titleAr} — نِمبوس مارت` : 'المنتج — نِمبوس مارت')),
})

const selectedVariantId = ref<string | null>(null)
const selectedImageIndex = ref(0)
const quantity = ref(1)
const wished = ref(false)

type AddState = 'idle' | 'adding' | 'added' | 'error'
const addState = ref<AddState>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

watch(
  product,
  (value) => {
    if (value && !selectedVariantId.value) {
      selectedVariantId.value = value.defaultVariantId
    }
  },
  { immediate: true },
)

const selectedVariant = computed(() =>
  product.value?.variants.find(variant => variant.id === selectedVariantId.value) ?? null,
)

const effectivePriceCents = computed(() => {
  if (!product.value) return '0'
  return selectedVariant.value?.priceCents ?? product.value.priceCents
})

const price = computed(() => formatBase(effectivePriceCents.value))
const comparePrice = computed(() =>
  product.value?.compareAtCents ? formatBase(product.value.compareAtCents) : null,
)

const inStock = computed(() => (selectedVariant.value?.stock ?? 0) > 0)

const displayImages = computed(() => {
  if (!product.value) return [] as string[]
  const images = product.value.images.filter(Boolean)
  if (images.length > 0) return images
  return product.value.variants
    .map(variant => variant.imageUrl)
    .filter((url): url is string => url !== null)
})

const currentImage = computed(
  () => displayImages.value[selectedImageIndex.value] ?? displayImages.value[0] ?? '',
)

const sizes = computed(() => {
  const seen: string[] = []
  for (const variant of product.value?.variants ?? []) {
    if (variant.size && !seen.includes(variant.size)) seen.push(variant.size)
  }
  return seen
})

const colors = computed(() => {
  const seen = new Map<string, string>()
  for (const variant of product.value?.variants ?? []) {
    if (variant.color && !seen.has(variant.color)) {
      seen.set(variant.color, variant.colorHex ?? '#888888')
    }
  }
  return seen
})

function selectSize(size: string) {
  const match = (product.value?.variants ?? []).find(variant => variant.size === size)
  if (match) {
    selectedVariantId.value = match.id
    selectedImageIndex.value = 0
  }
}

function selectColor(color: string) {
  const match = (product.value?.variants ?? []).find(variant => variant.color === color)
  if (match) {
    selectedVariantId.value = match.id
    selectedImageIndex.value = 0
  }
}

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
  const variantId = selectedVariantId.value
  if (!variantId || addState.value === 'adding' || !inStock.value) return
  addState.value = 'adding'
  try {
    await addItem(variantId, quantity.value)
    scheduleReset('added', 1500)
  } catch {
    scheduleReset('error', 2500)
  }
}

async function toggleWishlist() {
  if (!product.value) return
  try {
    const result = await $fetch<{ inWishlist: boolean }>('/api/wishlist', {
      method: 'POST',
      body: { productId: product.value.productId },
    })
    wished.value = result.inWishlist
    wishlistCount.value = Math.max(0, wishlistCount.value + (result.inWishlist ? 1 : -1))
  } catch (err) {
    if (statusOf(err) === 401) {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  }
}

onUnmounted(() => {
  if (resetTimer !== null) clearTimeout(resetTimer)
})
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">جاري التحميل…</div>

    <div v-else-if="error || !product" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">تعذّر تحميل المنتج</p>
      <p class="mb-4 text-sm text-mutedtext">ربما تم حذف المنتج أو أن الرابط غير صحيح.</p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
          @click="refresh()"
        >
          إعادة المحاولة
        </button>
        <NuxtLink
          to="/products"
          class="rounded-full border border-line px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
        >
          كل المنتجات
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <SiteBreadcrumbs
        :items="[
          { label: 'الرئيسية', href: '/' },
          { label: 'المنتجات', href: '/products' },
          { label: product.category.nameAr, href: `/categories/${product.category.slug}` },
          { label: product.titleAr },
        ]"
      />

      <div class="grid gap-8 lg:grid-cols-2">
        <div>
          <div class="aspect-square overflow-hidden rounded-2xl border border-line bg-[#FAFAFA]">
            <img
              :src="currentImage"
              :alt="product.titleAr"
              class="h-full w-full object-contain p-4"
            >
          </div>
          <div v-if="displayImages.length > 1" class="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="(image, index) in displayImages"
              :key="image"
              type="button"
              class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors focus-visible:outline-2 focus-visible:outline-brand"
              :class="index === selectedImageIndex ? 'border-brand' : 'border-line'"
              :aria-label="`الصورة ${index + 1}`"
              @click="selectedImageIndex = index"
            >
              <img :src="image" :alt="`${product.titleAr} — صورة ${index + 1}`" loading="lazy" class="h-full w-full object-cover">
            </button>
          </div>
        </div>

        <div>
          <span class="text-sm font-semibold text-mutedtext">{{ product.category.nameAr }}</span>
          <h1 class="mt-1 text-2xl font-extrabold leading-snug text-navy md:text-3xl">
            {{ product.titleAr }}
          </h1>
          <p v-if="product.titleEn" class="mt-1 text-sm text-mutedtext" dir="ltr" style="text-align: start;">{{ product.titleEn }}</p>

          <div class="mt-4 flex flex-wrap items-baseline gap-3">
            <span class="text-2xl font-black text-navy">{{ price }}</span>
            <span v-if="comparePrice" class="text-base text-mutedtext line-through">{{ comparePrice }}</span>
            <span
              v-if="product.discountPercent"
              class="rounded-full bg-neon px-2.5 py-0.5 text-xs font-black text-brand-alt"
            >خصم -{{ product.discountPercent }}%</span>
          </div>

          <p class="mt-5 text-sm leading-relaxed text-bodytext">{{ product.descriptionAr }}</p>

          <div v-if="sizes.length > 0" class="mt-6">
            <h2 class="mb-2 text-sm font-bold text-navy">المقاس</h2>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="size in sizes"
                :key="size"
                type="button"
                class="min-w-11 rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                :class="selectedVariant?.size === size ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy'"
                @click="selectSize(size)"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <div v-if="colors.size > 0" class="mt-5">
            <h2 class="mb-2 text-sm font-bold text-navy">اللون</h2>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="[color, hex] in colors"
                :key="color"
                type="button"
                class="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                :class="selectedVariant?.color === color ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:border-navy'"
                @click="selectColor(color)"
              >
                <span
                  class="h-4 w-4 rounded-full border border-black/10"
                  :style="{ backgroundColor: hex }"
                  aria-hidden="true"
                />
                {{ color }}
              </button>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <QtyStepper v-model="quantity" :max="Math.max(1, selectedVariant?.stock ?? 1)" />
            <button
              type="button"
              class="flex h-11 flex-1 min-w-40 items-center justify-center gap-2 rounded-xl bg-neon px-6 text-sm font-black text-brand-alt transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand"
              :disabled="!selectedVariantId || !inStock || addState === 'adding'"
              @click="addToCart"
            >
              <template v-if="addState === 'added'">
                <Check :size="17" aria-hidden="true" />
                تمت الإضافة إلى السلة
              </template>
              <template v-else-if="addState === 'error'">
                <TriangleAlert :size="17" aria-hidden="true" />
                تعذّرت الإضافة — حاول مرة أخرى
              </template>
              <template v-else-if="!inStock">
                نفد المخزون
              </template>
              <template v-else>
                <ShoppingBag :size="17" aria-hidden="true" />
                أضف إلى السلة
              </template>
            </button>
            <button
              type="button"
              class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-brand"
              :class="wished ? 'border-red-200 bg-red-50 text-red-500' : 'border-line text-navy hover:border-navy'"
              :aria-pressed="wished"
              :aria-label="wished ? 'إزالة من المفضلة' : 'أضف إلى المفضلة'"
              @click="toggleWishlist"
            >
              <Heart :size="19" :fill="wished ? 'currentColor' : 'none'" aria-hidden="true" />
            </button>
          </div>

          <p v-if="selectedVariant" class="mt-3 text-xs text-mutedtext">
            SKU: <bdi dir="ltr">{{ selectedVariant.sku }}</bdi>
            · المتبقي: {{ selectedVariant.stock }} قطعة
          </p>

          <ul class="mt-6 grid gap-3 rounded-2xl bg-surface p-5 text-sm text-bodytext sm:grid-cols-3">
            <li class="flex items-center gap-2">
              <Truck :size="17" class="shrink-0 text-brand" aria-hidden="true" />
              توصيل لكل المحافظات
            </li>
            <li class="flex items-center gap-2">
              <RotateCcw :size="17" class="shrink-0 text-brand" aria-hidden="true" />
              استرجاع حسب الشروط
            </li>
            <li class="flex items-center gap-2">
              <ShieldCheck :size="17" class="shrink-0 text-brand" aria-hidden="true" />
              دفع آمن
            </li>
          </ul>
        </div>
      </div>

      <section v-if="product.related.length > 0" class="mt-14">
        <SectionHeader title="منتجات مشابهة" :href="`/categories/${product.category.slug}`" href-label="عرض الكل" />
        <ProductRow :items="product.related" />
      </section>
    </template>
  </div>
</template>
