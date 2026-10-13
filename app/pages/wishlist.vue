<script setup lang="ts">
import { Heart } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { WishlistResponseDto } from '~/types/api'

const { t } = useI18n()

definePageMeta({ middleware: ['auth'] })
useHead(() => ({ title: `${t('header.wishlist')} — ${t('header.brand')}` }))

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
    <h1 class="mb-6 text-2xl font-extrabold text-navy md:text-3xl">{{ t('header.wishlist') }}</h1>

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">{{ t('common.loading') }}</div>

    <div v-else-if="error" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">{{ t('wishlist.errorTitle') }}</p>
      <p class="mb-4 text-sm text-mutedtext">{{ t('wishlist.errorHint') }}</p>
      <button
        type="button"
        class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <EmptyState
      v-else-if="items.length === 0"
      :title="t('wishlist.emptyTitle')"
      :hint="t('wishlist.emptyHint')"
      :action-label="t('common.shopNow')"
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
