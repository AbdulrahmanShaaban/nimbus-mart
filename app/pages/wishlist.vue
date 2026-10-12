<script setup lang="ts">
import { Heart } from '@lucide/vue'
import type { WishlistResponseDto } from '~/types/api'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'المفضلة — نِمبوس مارت' })

const wishlistCount = useState<number>('nm-wishlist-count', () => 0)

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  'wishlist',
  () => requestFetch<WishlistResponseDto>('/api/wishlist'),
)

const items = computed(() => data.value?.items ?? [])

watch(
  items,
  (value) => {
    wishlistCount.value = value.length
  },
  { immediate: true },
)

function onWishedChange(_productId: string, inWishlist: boolean) {
  if (!inWishlist) refresh()
}
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <h1 class="mb-6 text-2xl font-extrabold text-navy md:text-3xl">المفضلة</h1>

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">جاري التحميل…</div>

    <div v-else-if="error" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">تعذّر تحميل المفضلة</p>
      <p class="mb-4 text-sm text-mutedtext">حدث خطأ أثناء جلب البيانات، حاول مرة أخرى.</p>
      <button
        type="button"
        class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
        @click="refresh()"
      >
        إعادة المحاولة
      </button>
    </div>

    <EmptyState
      v-else-if="items.length === 0"
      title="قائمة المفضلة فارغة"
      hint="اضغط على أيقونة القلب في أي منتج لإضافته هنا."
      action-label="تسوّق الآن"
      action-href="/products"
      :icon="Heart"
    />

    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <ProductCard
        v-for="item in items"
        :key="item.productId"
        :product="item"
        initial-wished
        @wished-change="onWishedChange"
      />
    </div>
  </div>
</template>
