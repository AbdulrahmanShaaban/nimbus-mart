<script setup lang="ts">
import { SlidersHorizontal, ChevronLeft, ChevronRight, Tag } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { CategoryDto, ProductListDto } from '~/types/api'

const props = defineProps<{
  heading: string
  fixedCategory?: string | null
}>()

const route = useRoute()

const { t, locale } = useI18n()
const { pick } = useLocalized()

const PrevIcon = computed(() => (locale.value === 'en' ? ChevronLeft : ChevronRight))
const NextIcon = computed(() => (locale.value === 'en' ? ChevronRight : ChevronLeft))

const PAGE_SIZE = 12

function queryValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

const initialMin = queryValue(route.query.min)
const initialMax = queryValue(route.query.max)

const minDraft = ref(initialMin)
const maxDraft = ref(initialMax)

const sort = computed(() => queryValue(route.query.sort) || 'newest')
const saleOnly = computed(() => queryValue(route.query.sale) === '1')
const currentPage = computed(() => {
  const parsed = Number.parseInt(queryValue(route.query.page), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
})
const activeCategory = computed(() => props.fixedCategory ?? queryValue(route.query.category))
const searchQuery = computed(() => queryValue(route.query.q))

const filtersOpen = ref(false)

watch(
  () => [queryValue(route.query.min), queryValue(route.query.max)] as const,
  ([min, max]) => {
    minDraft.value = min
    maxDraft.value = max
  },
)

const queryParams = computed<Record<string, string>>(() => {
  const params: Record<string, string> = {
    page: String(currentPage.value),
    limit: String(PAGE_SIZE),
  }
  if (searchQuery.value) params.q = searchQuery.value
  if (activeCategory.value) params.category = activeCategory.value
  if (sort.value !== 'newest') params.sort = sort.value
  if (saleOnly.value) params.sale = '1'
  if (minDraft.value) params.min = minDraft.value
  if (maxDraft.value) params.max = maxDraft.value
  return params
})

const querySnapshot = computed(() => JSON.stringify(queryParams.value))

const { data, pending, error, refresh } = await useAsyncData(
  () => `product-list:${route.path}:${querySnapshot.value}`,
  () => $fetch<ProductListDto>('/api/products', { params: queryParams.value }),
)

const { data: categoriesData } = await useAsyncData(
  'site-categories',
  () => $fetch<{ items: CategoryDto[] }>('/api/categories'),
)

const categories = computed(() => categoriesData.value?.items ?? [])
const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() =>
  data.value?.pageSize ? Math.max(1, Math.ceil(total.value / data.value.pageSize)) : 1,
)

function setQuery(patch: Record<string, string | undefined>, resetPage = true) {
  const removals = new Set(
    Object.entries(patch)
      .filter(([, value]) => value === undefined || value === '')
      .map(([key]) => key),
  )
  const nextQuery: Record<string, string> = {}
  for (const key of ['q', 'category', 'sort', 'page', 'sale', 'min', 'max']) {
    if (removals.has(key)) continue
    const value = queryValue(route.query[key])
    if (value) nextQuery[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '') continue
    nextQuery[key] = value
  }
  if (resetPage) delete nextQuery.page
  return navigateTo({ path: route.path, query: nextQuery })
}

function onCategoryChange(slug: string) {
  if (props.fixedCategory) {
    return navigateTo(`/categories/${slug}`)
  }
  return setQuery({ category: slug || undefined })
}

function onSortChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  return setQuery({ sort: target.value === 'newest' ? undefined : target.value })
}

function onSaleChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  return setQuery({ sale: target.checked ? '1' : undefined })
}

function onPriceCommit() {
  if (minDraft.value && !/^\d+$/.test(minDraft.value)) return
  if (maxDraft.value && !/^\d+$/.test(maxDraft.value)) return
  return setQuery({ min: minDraft.value || undefined, max: maxDraft.value || undefined })
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  return setQuery({ page: String(page) }, false)
}
</script>

<template>
  <div class="flex flex-col gap-6 md:flex-row md:gap-8">
    <aside class="w-full shrink-0 md:w-64">
      <button
        type="button"
        class="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-2.5 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand md:hidden"
        :aria-expanded="filtersOpen"
        @click="filtersOpen = !filtersOpen"
      >
        <SlidersHorizontal :size="16" aria-hidden="true" />
        {{ filtersOpen ? t('pb.filtersHide') : t('pb.filtersShow') }}
      </button>
      <div
        class="rounded-2xl border border-line bg-white p-5 md:sticky md:top-44"
        :class="{ 'hidden md:block': !filtersOpen }"
      >
        <h2 class="mb-4 flex items-center gap-2 text-base font-extrabold text-navy">
          <SlidersHorizontal :size="18" aria-hidden="true" />
          {{ t('pb.filtersShow') }}
        </h2>

        <div class="mb-5">
          <h3 class="mb-2 text-sm font-bold text-navy">{{ t('header.categories') }}</h3>
          <div class="max-h-56 overflow-y-auto pe-1">
            <label class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-bodytext transition-colors hover:bg-surface has-[:checked]:bg-surface has-[:checked]:font-bold has-[:checked]:text-navy">
              <input
                type="radio"
                name="category-filter"
                :checked="!activeCategory"
                class="accent-brand focus-visible:outline-2 focus-visible:outline-brand"
                @change="onCategoryChange('')"
              >
              {{ t('pb.allCategories') }}
            </label>
            <label
              v-for="category in categories"
              :key="category.slug"
              class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-bodytext transition-colors hover:bg-surface has-[:checked]:bg-surface has-[:checked]:font-bold has-[:checked]:text-navy"
            >
              <input
                type="radio"
                name="category-filter"
                :checked="activeCategory === category.slug"
                class="accent-brand focus-visible:outline-2 focus-visible:outline-brand"
                @change="onCategoryChange(category.slug)"
              >
              {{ pick(category.nameAr, category.nameEn) }}
            </label>
          </div>
        </div>

        <div class="mb-5">
          <h3 class="mb-2 text-sm font-bold text-navy">{{ t('pb.price', { currency: t('common.egp') }) }}</h3>
          <div class="flex items-center gap-2">
            <input
              v-model="minDraft"
              type="number"
              min="0"
              inputmode="numeric"
              :placeholder="t('pb.priceMinPlaceholder')"
              :aria-label="t('pb.priceMinAria')"
              class="h-10 w-full min-w-0 rounded-xl border border-line px-3 text-sm text-navy placeholder:text-mutedtext focus-visible:outline-2 focus-visible:outline-brand"
              @change="onPriceCommit"
            >
            <span class="text-mutedtext">—</span>
            <input
              v-model="maxDraft"
              type="number"
              min="0"
              inputmode="numeric"
              :placeholder="t('pb.priceMaxPlaceholder')"
              :aria-label="t('pb.priceMaxAria')"
              class="h-10 w-full min-w-0 rounded-xl border border-line px-3 text-sm text-navy placeholder:text-mutedtext focus-visible:outline-2 focus-visible:outline-brand"
              @change="onPriceCommit"
            >
          </div>
        </div>

        <div class="mb-5">
          <h3 class="mb-2 text-sm font-bold text-navy">{{ t('pb.sortLabel') }}</h3>
          <select
            :value="sort"
            :aria-label="t('pb.sortAria')"
            class="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
            @change="onSortChange"
          >
            <option value="newest">{{ t('pb.sortNewest') }}</option>
            <option value="price_asc">{{ t('pb.sortPriceAsc') }}</option>
            <option value="price_desc">{{ t('pb.sortPriceDesc') }}</option>
          </select>
        </div>

        <label class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            :checked="saleOnly"
            class="h-4 w-4 accent-brand focus-visible:outline-2 focus-visible:outline-brand"
            @change="onSaleChange"
          >
          {{ t('pb.saleOnly') }}
        </label>
      </div>
    </aside>

    <section class="min-w-0 flex-1">
      <div class="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 class="text-2xl font-extrabold text-navy md:text-3xl">{{ heading }}</h1>
        <p v-if="!pending && !error" class="text-sm text-mutedtext">
          {{ t('common.results', { count: total }) }}
        </p>
      </div>

      <div v-if="pending" aria-live="polite">
        <p class="mb-4 text-sm text-mutedtext">{{ t('common.loading') }}</p>
        <LoadingSkeleton :count="8" />
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-line bg-white p-8 text-center"
        role="alert"
      >
        <p class="mb-1 font-bold text-navy">{{ t('pb.loadErrorTitle') }}</p>
        <p class="mb-4 text-sm text-mutedtext">{{ t('pb.loadErrorHint') }}</p>
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
        :title="t('pb.emptyTitle')"
        :hint="t('pb.emptyHint')"
        :action-label="t('pb.emptyAction')"
        action-href="/products"
        :icon="Tag"
      />

      <template v-else>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <ProductCard v-for="item in items" :key="item.productId" :product="item" />
        </div>

        <nav
          v-if="totalPages > 1"
          class="mt-8 flex flex-wrap items-center justify-center gap-3"
          :aria-label="t('pb.paginationAria')"
        >
          <button
            type="button"
            class="flex items-center gap-1 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <component :is="PrevIcon" :size="16" aria-hidden="true" />
            {{ t('common.prev') }}
          </button>
          <span class="text-sm text-mutedtext">
            {{ t('pb.pageOf', { page: currentPage, total: totalPages }) }}
          </span>
          <button
            type="button"
            class="flex items-center gap-1 rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('common.next') }}
            <component :is="NextIcon" :size="16" aria-hidden="true" />
          </button>
        </nav>
      </template>
    </section>
  </div>
</template>
