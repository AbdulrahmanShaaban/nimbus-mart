<script setup lang="ts">
import { Tag } from '@lucide/vue'
import type { CategoryDto } from '~/types/api'

const route = useRoute()
const slug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : ''))

const { data: categoriesData, pending, error, refresh } = await useAsyncData(
  'site-categories',
  () => $fetch<{ items: CategoryDto[] }>('/api/categories'),
)

const category = computed(
  () => (categoriesData.value?.items ?? []).find(item => item.slug === slug.value) ?? null,
)
const categoryName = computed(() => category.value?.nameAr ?? 'التصنيف')

useHead({
  title: computed(() => `${categoryName.value} — نِمبوس مارت`),
})
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs
      :items="[
        { label: 'الرئيسية', href: '/' },
        { label: 'المنتجات', href: '/products' },
        { label: categoryName },
      ]"
    />

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">
      جاري التحميل…
    </div>

    <div v-else-if="error" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">تعذّر تحميل التصنيف</p>
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
      v-else-if="!category"
      title="هذا التصنيف غير موجود"
      hint="ربما تم حذفه أو أن الرابط غير صحيح."
      action-label="كل المنتجات"
      action-href="/products"
      :icon="Tag"
    />

    <ProductBrowser v-else :heading="categoryName" :fixed-category="slug" />
  </div>
</template>
