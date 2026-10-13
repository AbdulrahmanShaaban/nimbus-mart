<script setup lang="ts">
import { Tag } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { CategoryDto } from '~/types/api'

const { t } = useI18n()
const { pick } = useLocalized()

const route = useRoute()
const slug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : ''))

const { data: categoriesData, pending, error, refresh } = await useAsyncData(
  'site-categories',
  () => $fetch<{ items: CategoryDto[] }>('/api/categories'),
)

const category = computed(
  () => (categoriesData.value?.items ?? []).find(item => item.slug === slug.value) ?? null,
)
const categoryName = computed(() => {
  const current = category.value
  return current ? pick(current.nameAr, current.nameEn) : t('category.fallbackName')
})

useHead({
  title: computed(() => `${categoryName.value} — ${t('header.brand')}`),
})
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs
      :items="[
        { label: t('nav.home'), href: '/' },
        { label: t('product.breadcrumbProducts'), href: '/products' },
        { label: categoryName },
      ]"
    />

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">{{ t('category.errorTitle') }}</p>
      <p class="mb-4 text-sm text-mutedtext">{{ t('category.errorHint') }}</p>
      <button
        type="button"
        class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <EmptyState
      v-else-if="!category"
      :title="t('category.emptyTitle')"
      :hint="t('category.emptyHint')"
      :action-label="t('header.allProducts')"
      action-href="/products"
      :icon="Tag"
    />

    <ProductBrowser v-else :heading="categoryName" :fixed-category="slug" />
  </div>
</template>
