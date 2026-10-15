<script setup lang="ts">
import { X, ShoppingBag, Check, TriangleAlert, ArrowLeft } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { ProductDetailDto, ProductVariantDto } from '~/types/api'

const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { pick } = useLocalized()
const { addItem } = useCart()

const detail = ref<ProductDetailDto | null>(null)
const loading = ref(true)
const loadFailed = ref(false)
const selectedColor = ref<string | null>(null)
const selectedSize = ref<string | null>(null)
const quantity = ref(1)
const addState = ref<'idle' | 'adding' | 'added' | 'error'>('idle')
const panelRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
let lastFocused: HTMLElement | null = null

const variants = computed(() => detail.value?.variants ?? [])

const colorOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const variant of variants.value) {
    if (variant.color !== null && !seen.has(variant.color)) {
      seen.set(variant.color, variant.colorHex ?? '#CCCCCC')
    }
  }
  return [...seen.entries()].map(([color, hex]) => ({ color, hex }))
})

const sizeOptions = computed(() => {
  const rows = variants.value.filter(
    (variant) => colorOptions.value.length === 0 || variant.color === selectedColor.value,
  )
  const seen = new Map<string, boolean>()
  for (const row of rows) {
    if (row.size !== null) {
      seen.set(row.size, (seen.get(row.size) ?? false) || row.stock > 0)
    }
  }
  return [...seen.entries()].map(([size, available]) => ({ size, available }))
})

const selectedVariant = computed<ProductVariantDto | null>(() => {
  const rows = variants.value
  if (rows.length === 0) return null
  const matches = rows.filter(
    (variant) =>
      (colorOptions.value.length === 0 || variant.color === selectedColor.value)
      && (sizeOptions.value.length === 0 || variant.size === selectedSize.value),
  )
  return matches.find((variant) => variant.stock > 0) ?? matches[0] ?? null
})

const productTitle = computed(() =>
  detail.value ? pick(detail.value.titleAr, detail.value.titleEn) : '',
)

const productDescription = computed(() => {
  if (!detail.value) return ''
  const text = pick(detail.value.descriptionAr, detail.value.descriptionEn ?? detail.value.descriptionAr)
  return text.trim()
})

const imageUrl = computed(() => {
  const variantImage = selectedVariant.value?.imageUrl
  if (variantImage) return variantImage
  return detail.value?.images[0] ?? ''
})

const priceCents = computed(() => selectedVariant.value?.priceCents ?? detail.value?.priceCents ?? '0')
const stock = computed(() => selectedVariant.value?.stock ?? 0)
const canAdd = computed(() => selectedVariant.value !== null && stock.value > 0 && addState.value !== 'adding')

function initSelection(product: ProductDetailDto) {
  const def =
    product.variants.find((variant) => variant.id === product.defaultVariantId)
    ?? product.variants.find((variant) => variant.stock > 0)
    ?? product.variants[0]
    ?? null
  selectedColor.value = def?.color ?? null
  selectedSize.value = def?.size ?? null
  quantity.value = 1
}

async function load() {
  loading.value = true
  loadFailed.value = false
  try {
    const product = await $fetch<ProductDetailDto>(`/api/products/${props.slug}`)
    detail.value = product
    initSelection(product)
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

function selectColor(color: string) {
  selectedColor.value = color
  const offered = sizeOptions.value
  if (offered.length > 0 && !offered.some((row) => row.size === selectedSize.value)) {
    selectedSize.value = offered.find((row) => row.available)?.size ?? offered[0]?.size ?? null
  }
}

function selectSize(size: string) {
  selectedSize.value = size
}

function close() {
  emit('close')
}

async function addToCart() {
  const variant = selectedVariant.value
  if (!variant || stock.value <= 0 || addState.value === 'adding') return
  addState.value = 'adding'
  try {
    await addItem(variant.id, quantity.value)
    addState.value = 'added'
    setTimeout(() => {
      addState.value = 'idle'
    }, 1500)
  } catch {
    addState.value = 'error'
    setTimeout(() => {
      addState.value = 'idle'
    }, 2500)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

function onBackdrop() {
  close()
}

watch(stock, (value) => {
  if (value > 0 && quantity.value > value) quantity.value = value
})

onMounted(() => {
  lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
  void load()
  void nextTick(() => closeButtonRef.value?.focus())
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  lastFocused?.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[95] overflow-y-auto">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true" @click="onBackdrop" />
      <div class="flex min-h-full items-start justify-center p-3 md:p-6">
        <div
          ref="panelRef"
          class="relative z-10 w-full max-w-[880px] rounded-2xl bg-white p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-6"
          role="dialog"
          aria-modal="true"
          :aria-label="t('qv.title')"
        >
          <button
            ref="closeButtonRef"
            type="button"
            class="absolute end-3 top-3 grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
            :aria-label="t('qv.close')"
            @click="close"
          >
            <X :size="20" aria-hidden="true" />
          </button>

          <div v-if="loading" class="grid gap-6 md:grid-cols-2" aria-live="polite">
            <div class="aspect-square animate-pulse rounded-xl bg-surface" />
            <div class="space-y-3 pt-2">
              <div class="h-5 w-4/5 animate-pulse rounded-full bg-surface" />
              <div class="h-4 w-2/5 animate-pulse rounded-full bg-surface" />
              <div class="h-20 w-full animate-pulse rounded-xl bg-surface" />
              <div class="h-10 w-full animate-pulse rounded-xl bg-surface" />
            </div>
          </div>

          <div v-else-if="loadFailed || !detail" class="px-2 py-10 text-center" role="alert">
            <p class="mb-3 text-sm font-bold text-navy">{{ t('qv.loadError') }}</p>
            <button
              type="button"
              class="rounded-full bg-navy px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
              @click="load"
            >
              {{ t('common.retry') }}
            </button>
          </div>

          <div v-else class="grid gap-5 pt-6 md:grid-cols-2 md:gap-8 md:pt-0">
            <div class="relative aspect-square overflow-hidden rounded-xl border border-line bg-[#FAFAFA] p-3 md:p-5">
              <img
                :src="imageUrl"
                :alt="productTitle"
                class="h-full w-full object-contain"
              >
            </div>

            <div class="flex flex-col">
              <h2 class="mb-1 text-lg font-black text-navy md:text-xl">{{ productTitle }}</h2>
              <PriceBlock :price-cents="priceCents" :compare-at-cents="detail.compareAtCents" size="md" />
              <p v-if="productDescription" class="mt-3 line-clamp-2 text-sm leading-relaxed text-bodytext">
                {{ productDescription }}
              </p>

              <div v-if="colorOptions.length > 0" class="mt-4">
                <p class="mb-2 text-xs font-black text-navy">{{ t('product.color') }}</p>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    v-for="option in colorOptions"
                    :key="option.color"
                    type="button"
                    class="h-8 w-8 rounded-full ring-1 ring-black/10 transition-all focus-visible:outline-2 focus-visible:outline-brand"
                    :class="selectedColor === option.color ? 'ring-2 ring-navy ring-offset-2' : 'hover:ring-navy/40'"
                    :style="{ backgroundColor: option.hex }"
                    :aria-pressed="selectedColor === option.color"
                    :aria-label="option.color"
                    :title="option.color"
                    @click="selectColor(option.color)"
                  />
                </div>
              </div>

              <div v-if="sizeOptions.length > 0" class="mt-4">
                <p class="mb-2 text-xs font-black text-navy">{{ t('product.size') }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in sizeOptions"
                    :key="option.size"
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                    :class="[
                      selectedSize === option.size ? 'border-navy bg-navy text-white' : 'border-line text-navy hover:border-navy',
                      option.available ? '' : 'cursor-not-allowed opacity-40 line-through',
                    ]"
                    :disabled="!option.available"
                    :aria-pressed="selectedSize === option.size"
                    @click="selectSize(option.size)"
                  >
                    {{ option.size }}
                  </button>
                </div>
              </div>

              <div class="mt-5 flex items-center gap-3">
                <QtyStepper v-model="quantity" :max="Math.max(1, stock)" :disabled="stock <= 0" />
                <span v-if="stock > 0 && stock <= 5" class="text-xs font-bold text-amber-600">
                  {{ t('product.remaining', { count: stock }) }}
                </span>
              </div>

              <button
                type="button"
                class="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neon text-sm font-black text-brand-alt transition-all duration-300 hover:-translate-y-px hover:brightness-95 focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!canAdd"
                @click="addToCart"
              >
                <template v-if="addState === 'added'">
                  <Check :size="17" aria-hidden="true" />
                  {{ t('product.addedToCart') }}
                </template>
                <template v-else-if="addState === 'error'">
                  <TriangleAlert :size="17" aria-hidden="true" />
                  {{ t('product.addError') }}
                </template>
                <template v-else-if="stock <= 0">
                  {{ t('common.outOfStock') }}
                </template>
                <template v-else>
                  <ShoppingBag :size="17" aria-hidden="true" />
                  {{ t('common.addToCart') }}
                </template>
              </button>

              <NuxtLink
                :to="`/products/${slug}`"
                class="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-brand"
                @click="close"
              >
                {{ t('qv.fullDetails') }}
                <ArrowLeft :size="15" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
