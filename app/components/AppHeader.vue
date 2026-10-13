<script setup lang="ts">
import { Search, ShoppingBag, Heart, Menu, X, LayoutDashboard, ChevronDown, Globe } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { CategoryDto } from '~/types/api'

const route = useRoute()
const { t, locale, setLocale } = useI18n()
const { pick } = useLocalized()
const { count: cartCount, refresh: refreshCart } = useCart()
const { user, refresh: refreshAuth } = useAuth()
const { currency, currencies, loadRates } = useCurrency()
const wishlistCount = useState<number>('nm-wishlist-count', () => 0)

const mobileMenuOpen = ref(false)
const currencyOpen = ref(false)
const currencyRoot = ref<HTMLElement | null>(null)

const { data: categoriesData } = await useAsyncData('site-categories', () =>
  $fetch<{ items: CategoryDto[] }>('/api/categories'),
)

const categories = computed(() => categoriesData.value?.items ?? [])

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))
const otherLocaleLabel = computed(() => (locale.value === 'ar' ? 'EN' : 'ع'))

function toggleLocale() {
  void setLocale(otherLocale.value)
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
    currencyOpen.value = false
  },
)

function selectCurrency(code: string) {
  currency.value = code
  currencyOpen.value = false
}

function onDocClick(event: MouseEvent) {
  if (currencyRoot.value && !currencyRoot.value.contains(event.target as Node)) {
    currencyOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  void loadRates()
  refreshCart()
  await refreshAuth()
  if (!user.value) {
    wishlistCount.value = 0
    return
  }
  try {
    const res = await $fetch<{ items: unknown[] }>('/api/wishlist')
    wishlistCount.value = Array.isArray(res.items) ? res.items.length : 0
  } catch {
    wishlistCount.value = 0
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-white">
    <div class="mx-auto flex h-16 max-w-[1330px] items-center gap-1.5 px-3 md:h-[88px] md:gap-6 md:px-6">
      <button
        type="button"
        class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand md:hidden"
        :aria-expanded="mobileMenuOpen"
        aria-controls="nm-mobile-menu"
        :aria-label="t('header.menu')"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <X v-if="mobileMenuOpen" :size="22" aria-hidden="true" />
        <Menu v-else :size="22" aria-hidden="true" />
      </button>

      <NuxtLink
        to="/"
        class="flex min-w-0 items-center gap-1.5 text-lg font-black text-navy focus-visible:outline-2 focus-visible:outline-brand md:text-2xl"
      >
        <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-neon" aria-hidden="true" />
        <span class="truncate">{{ t('header.brand') }}</span>
      </NuxtLink>

      <form action="/search" method="get" class="hidden flex-1 md:block" role="search">
        <div class="relative mx-auto max-w-[520px]">
          <input
            type="search"
            name="q"
            :placeholder="t('common.searchPlaceholder')"
            :aria-label="t('header.searchProducts')"
            class="h-11 w-full rounded-full border-2 border-brand/50 bg-white ps-4 pe-11 text-sm text-navy placeholder:text-mutedtext focus-visible:outline-2 focus-visible:outline-brand"
          >
          <button
            type="submit"
            class="absolute end-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
            :aria-label="t('common.search')"
          >
            <Search :size="17" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div class="ms-auto flex shrink-0 items-center gap-0 md:gap-2">
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand md:hidden"
          :aria-label="t('common.switchLanguage')"
          @click="toggleLocale"
        >
          <span class="text-xs font-black" dir="ltr">{{ otherLocaleLabel }}</span>
        </button>
        <NuxtLink
          to="/search"
          class="grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand md:hidden"
          :aria-label="t('common.search')"
        >
          <Search :size="20" aria-hidden="true" />
        </NuxtLink>
        <button
          type="button"
          class="hidden h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-black text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand md:flex"
          :aria-label="t('common.switchLanguage')"
          @click="toggleLocale"
        >
          <Globe :size="14" aria-hidden="true" />
          <span dir="ltr">{{ otherLocaleLabel }}</span>
        </button>
        <NuxtLink
          v-if="user"
          to="/account"
          class="hidden h-10 items-center rounded-full border-2 border-brand px-4 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-brand md:inline-flex"
        >
          {{ t('header.account') }}
        </NuxtLink>
        <NuxtLink
          v-else
          to="/login"
          class="hidden h-10 items-center rounded-full border-2 border-brand px-4 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-brand md:inline-flex"
        >
          {{ t('header.login') }}
        </NuxtLink>
        <div ref="currencyRoot" class="relative hidden md:block">
          <button
            type="button"
            class="flex h-10 items-center gap-1 rounded-full border border-line px-3 text-xs font-black text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
            :aria-expanded="currencyOpen"
            aria-haspopup="listbox"
            :aria-label="t('common.currency')"
            @click="currencyOpen = !currencyOpen"
          >
            {{ currency }}
            <ChevronDown :size="13" aria-hidden="true" />
          </button>
          <ul
            v-if="currencyOpen && currencies.length > 1"
            class="absolute end-0 top-12 z-50 w-36 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-[0_8px_24px_rgba(12,40,123,0.14)]"
            role="listbox"
            :aria-label="t('common.currency')"
          >
            <li v-for="row in currencies" :key="row.code">
              <button
                type="button"
                class="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                :class="currency === row.code ? 'font-black text-brand' : 'text-navy'"
                role="option"
                :aria-selected="currency === row.code"
                @click="selectCurrency(row.code)"
              >
                {{ row.code }}
                <span class="text-xs text-mutedtext">{{ row.symbol }}</span>
              </button>
            </li>
          </ul>
        </div>
        <NuxtLink
          v-if="user?.role === 'ADMIN'"
          to="/admin"
          class="hidden h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand md:grid"
          :aria-label="t('header.adminPanel')"
        >
          <LayoutDashboard :size="20" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          to="/wishlist"
          class="relative grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          :aria-label="t('header.wishlist')"
        >
          <Heart :size="20" aria-hidden="true" />
          <span
            v-if="wishlistCount > 0"
            class="absolute -top-0.5 end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white"
          >{{ wishlistCount }}</span>
        </NuxtLink>
        <NuxtLink
          to="/cart"
          class="relative grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          :aria-label="t('header.cart')"
        >
          <ShoppingBag :size="20" aria-hidden="true" />
          <span
            v-if="cartCount > 0"
            class="absolute -top-0.5 end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white"
          >{{ cartCount }}</span>
        </NuxtLink>
      </div>
    </div>

    <nav
      v-if="mobileMenuOpen"
      id="nm-mobile-menu"
      class="border-t border-line bg-white px-4 py-3 md:hidden"
      :aria-label="t('header.menuMobile')"
    >
      <ul class="flex flex-col gap-1">
        <li>
          <NuxtLink to="/" class="block rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
            {{ t('header.home') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/products" class="block rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
            {{ t('header.allProducts') }}
          </NuxtLink>
        </li>
        <li v-for="category in categories" :key="category.slug">
          <NuxtLink
            :to="`/categories/${category.slug}`"
            class="block rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
          >
            {{ pick(category.nameAr, category.nameEn) }}
          </NuxtLink>
        </li>
        <li v-if="user?.role === 'ADMIN'">
          <NuxtLink to="/admin" class="block rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
            {{ t('header.adminPanel') }}
          </NuxtLink>
        </li>
        <li class="mt-1 border-t border-line pt-2">
          <NuxtLink :to="user ? '/account' : '/login'" class="block rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
            {{ user ? t('header.account') : t('header.login') }}
          </NuxtLink>
        </li>
        <li class="border-t border-line pt-2">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
            @click="toggleLocale"
          >
            <Globe :size="16" aria-hidden="true" />
            {{ t('common.language') }}
            <span class="ms-auto text-xs text-mutedtext" dir="ltr">{{ otherLocaleLabel }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <nav class="border-t border-neon/40 bg-neon" :aria-label="t('header.categories')">
      <div class="nm-no-scrollbar mx-auto flex max-w-[1330px] items-center gap-0 overflow-x-auto px-4 py-2 md:px-6">
        <NuxtLink
          to="/"
          class="shrink-0 rounded-full px-2.5 py-1.5 text-center text-[13px] font-bold leading-tight text-navy transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand"
          :class="{ 'bg-white/80': route.path === '/' }"
        >
          {{ t('header.home') }}
        </NuxtLink>
        <NuxtLink
          v-for="category in categories"
          :key="category.slug"
          :to="`/categories/${category.slug}`"
          class="flex shrink-0 items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 text-center text-[13px] font-bold leading-tight text-navy transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand md:max-w-[96px] md:px-2"
          :class="{ 'bg-white/80': route.path === `/categories/${category.slug}` }"
        >
          <span class="min-w-0">{{ pick(category.nameAr, category.nameEn) }}</span>
          <ChevronDown :size="12" class="hidden shrink-0 self-center md:block" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          to="/products"
          class="flex shrink-0 items-center justify-center gap-0.5 rounded-full px-2.5 py-1.5 text-center text-[13px] font-bold leading-tight text-navy transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand"
        >
          {{ t('header.more') }}
          <ChevronDown :size="12" class="hidden shrink-0 self-center md:block" aria-hidden="true" />
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>
