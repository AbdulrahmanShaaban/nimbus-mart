<script setup lang="ts">
import { Search, ShoppingBag, Heart, Menu, X, LayoutDashboard, ChevronDown, Globe, Bell, PackageSearch } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { CategoryDto } from '~/types/api'
import { useAdminDateFormat } from '~/utils/admin-status'

interface NotificationItem {
  orderNumber: string
  createdAt: string
  status: string
  totalCents: string
  itemCount: number
}

const route = useRoute()
const { t, locale, setLocale } = useI18n()
const { pick } = useLocalized()
const { count: cartCount, refresh: refreshCart } = useCart()
const { user, refresh: refreshAuth } = useAuth()
const { currency, currencies, loadRates } = useCurrency()
const { adminFormatDate } = useAdminDateFormat()
const wishlistCount = useState<number>('nm-wishlist-count', () => 0)

const mobileMenuOpen = ref(false)
const currencyOpen = ref(false)
const notificationsOpen = ref(false)
const moreOpen = ref(false)

const currencyRoot = ref<HTMLElement | null>(null)
const notificationsRoot = ref<HTMLElement | null>(null)
const moreRoot = ref<HTMLElement | null>(null)
const mobileMenuRoot = ref<HTMLElement | null>(null)

const { data: categoriesData } = await useAsyncData('site-categories', () =>
  $fetch<{ items: CategoryDto[] }>('/api/categories'),
)

const categories = computed(() => categoriesData.value?.items ?? [])
const primaryCategories = computed(() => categories.value.slice(0, 8))
const overflowCategories = computed(() => categories.value.slice(8))

const notifications = ref<NotificationItem[]>([])
const notificationsLoaded = ref(false)
const notificationsLoading = ref(false)

const otherLocale = computed(() => (locale.value === 'ar' ? 'en' : 'ar'))
const otherLocaleLabel = computed(() => (locale.value === 'ar' ? 'EN' : 'ع'))

async function toggleLocale() {
  await setLocale(otherLocale.value)
  window.location.reload()
}

function closeAllPanels() {
  currencyOpen.value = false
  notificationsOpen.value = false
  moreOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
    closeAllPanels()
  },
)

async function loadNotifications() {
  if (notificationsLoaded.value || notificationsLoading.value) return
  notificationsLoading.value = true
  try {
    const res = await $fetch<{ items: NotificationItem[] }>('/api/account/orders', {
      query: { limit: 5 },
    })
    notifications.value = Array.isArray(res.items) ? res.items : []
    notificationsLoaded.value = true
  } catch {
    notifications.value = []
  } finally {
    notificationsLoading.value = false
  }
}

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  currencyOpen.value = false
  moreOpen.value = false
  if (notificationsOpen.value && user.value) void loadNotifications()
}

function selectCurrency(code: string) {
  currency.value = code
  currencyOpen.value = false
}

function onDocClick(event: MouseEvent) {
  const path = event.composedPath()
  const clickedOutside = (root: HTMLElement | null) => !!root && !path.some((node) => node instanceof Node && root.contains(node))
  if (clickedOutside(currencyRoot.value)) currencyOpen.value = false
  if (clickedOutside(notificationsRoot.value)) notificationsOpen.value = false
  if (clickedOutside(moreRoot.value)) moreOpen.value = false
  if (clickedOutside(mobileMenuRoot.value)) mobileMenuOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeAllPanels()
    mobileMenuOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKeydown)
  void loadRates()
  refreshCart()
  await refreshAuth()
  if (!user.value) {
    wishlistCount.value = 0
    return
  }
  void loadNotifications()
  try {
    const res = await $fetch<{ items: unknown[] }>('/api/wishlist')
    wishlistCount.value = Array.isArray(res.items) ? res.items.length : 0
  } catch {
    wishlistCount.value = 0
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-white">
    <div ref="mobileMenuRoot" class="md:contents">
      <div class="mx-auto flex h-16 max-w-[1330px] items-center gap-1 px-3 md:h-[84px] md:gap-5 md:px-6">
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

        <div class="flex min-w-0 flex-1 items-center justify-center md:flex-none md:justify-start">
          <NuxtLink
            to="/"
            class="flex min-w-0 items-center gap-1.5 text-lg font-black text-navy focus-visible:outline-2 focus-visible:outline-brand md:text-2xl"
          >
            <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-neon" aria-hidden="true" />
            <span class="truncate">{{ t('header.brand') }}</span>
          </NuxtLink>
        </div>

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

        <div class="flex shrink-0 items-center gap-0.5 md:gap-1.5">
          <NuxtLink
            to="/search"
            class="grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand md:hidden"
            :aria-label="t('common.search')"
          >
            <Search :size="20" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink
            to="/account/orders"
            class="hidden h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand sm:grid"
            :aria-label="t('header.trackOrder')"
            :title="t('header.trackOrder')"
          >
            <PackageSearch :size="20" aria-hidden="true" />
          </NuxtLink>
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
          <button
            type="button"
            class="hidden h-10 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-black text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand md:flex"
            :aria-label="t('common.switchLanguage')"
            @click="toggleLocale"
          >
            <Globe :size="14" aria-hidden="true" />
            <span dir="ltr">{{ otherLocaleLabel }}</span>
          </button>
          <div ref="currencyRoot" class="relative hidden md:block">
            <button
              type="button"
              class="flex h-10 items-center gap-1 rounded-full border border-line px-3 text-xs font-black text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
              :aria-expanded="currencyOpen"
              aria-haspopup="listbox"
              :aria-label="t('common.currency')"
              @click="currencyOpen = !currencyOpen; notificationsOpen = false; moreOpen = false"
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
            class="relative hidden h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand md:grid"
            :aria-label="t('header.wishlist')"
          >
            <Heart :size="20" aria-hidden="true" />
            <span
              v-if="wishlistCount > 0"
              class="absolute -top-0.5 end-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white"
            >{{ wishlistCount }}</span>
          </NuxtLink>
          <div ref="notificationsRoot" class="relative">
            <button
              type="button"
              class="relative grid h-10 w-10 place-items-center rounded-xl text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
              :aria-expanded="notificationsOpen"
              aria-haspopup="dialog"
              :aria-label="t('header.notifications')"
              @click="toggleNotifications"
            >
              <Bell :size="20" aria-hidden="true" />
            </button>
            <div
              v-if="notificationsOpen"
              class="fixed inset-x-2 top-[68px] z-50 rounded-2xl border border-line bg-white p-3 shadow-[0_12px_32px_rgba(12,40,123,0.18)] sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:w-[330px]"
              role="dialog"
              :aria-label="t('header.notifications')"
            >
              <p class="mb-2 px-1 text-sm font-black text-navy">{{ t('header.notifications') }}</p>
              <div v-if="!user" class="rounded-xl bg-surface px-3 py-4 text-center">
                <p class="mb-3 text-xs text-mutedtext">{{ t('header.notificationsSignIn') }}</p>
                <NuxtLink
                  :to="`/login?redirect=/account/orders`"
                  class="inline-flex h-9 items-center rounded-full bg-navy px-4 text-xs font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {{ t('header.login') }}
                </NuxtLink>
              </div>
              <div v-else-if="notificationsLoading" class="px-3 py-4 text-center text-xs text-mutedtext" aria-live="polite">
                {{ t('common.loading') }}
              </div>
              <div v-else-if="notifications.length === 0" class="px-3 py-4 text-center text-xs text-mutedtext">
                {{ t('header.notificationsEmpty') }}
              </div>
              <ul v-else class="max-h-[320px] space-y-1 overflow-y-auto">
                <li v-for="item in notifications" :key="item.orderNumber">
                  <NuxtLink
                    :to="`/account/orders/${item.orderNumber}`"
                    class="flex items-center gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <StatusBadge :status="item.status" />
                    <span class="min-w-0 flex-1">
                      <bdi dir="ltr" class="block truncate text-xs font-bold text-navy">{{ item.orderNumber }}</bdi>
                      <span class="block text-[11px] text-mutedtext">{{ adminFormatDate(item.createdAt) }}</span>
                    </span>
                  </NuxtLink>
                </li>
              </ul>
              <NuxtLink
                v-if="user"
                to="/account/orders"
                class="mt-2 block rounded-xl bg-surface px-3 py-2 text-center text-xs font-bold text-navy transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-brand"
              >
                {{ t('header.notificationsViewOrders') }}
              </NuxtLink>
            </div>
          </div>
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
        class="max-h-[calc(100dvh-8rem)] overflow-y-auto border-t border-line bg-white px-4 py-3 md:hidden"
        :aria-label="t('header.menuMobile')"
      >
        <ul class="flex flex-col gap-0.5">
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
        </ul>
        <ul class="mt-2 flex flex-col gap-0.5 border-t border-line pt-2">
          <li>
            <NuxtLink to="/account/orders" class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
              <PackageSearch :size="17" aria-hidden="true" />
              {{ t('header.trackOrder') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/wishlist" class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
              <Heart :size="17" aria-hidden="true" />
              {{ t('header.wishlist') }}
              <span v-if="wishlistCount > 0" class="ms-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{{ wishlistCount }}</span>
            </NuxtLink>
          </li>
          <li v-if="user?.role === 'ADMIN'">
            <NuxtLink to="/admin" class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
              <LayoutDashboard :size="17" aria-hidden="true" />
              {{ t('header.adminPanel') }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink :to="user ? '/account' : '/login'" class="block rounded-xl px-3 py-2.5 text-sm font-bold text-navy hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
              {{ user ? t('header.account') : t('header.login') }}
            </NuxtLink>
          </li>
          <li>
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
          <li v-if="currencies.length > 1" class="px-3 py-2.5">
            <p class="mb-2 text-sm font-bold text-navy">{{ t('common.currency') }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="row in currencies"
                :key="row.code"
                type="button"
                class="rounded-full border px-3.5 py-1.5 text-xs font-black transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                :class="currency === row.code ? 'border-navy bg-navy text-white' : 'border-line text-navy hover:border-navy'"
                :aria-pressed="currency === row.code"
                @click="selectCurrency(row.code)"
              >
                {{ row.code }}
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </div>

    <nav class="border-t border-neon/40 bg-neon" :aria-label="t('header.categories')">
      <div class="nm-no-scrollbar mx-auto flex max-w-[1330px] items-center gap-0 overflow-x-auto px-4 py-2 md:justify-center md:gap-5 md:px-6">
        <NuxtLink
          to="/"
          class="shrink-0 rounded-full px-2.5 py-1.5 text-center text-[13px] font-semibold leading-tight text-navy transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-brand"
          :class="{ 'bg-white/80': route.path === '/' }"
        >
          {{ t('header.home') }}
        </NuxtLink>
        <NuxtLink
          v-for="category in primaryCategories"
          :key="category.slug"
          :to="`/categories/${category.slug}`"
          class="shrink-0 rounded-full px-2.5 py-1.5 text-center text-[13px] font-semibold leading-tight text-navy transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-brand"
          :class="{ 'bg-white/80': route.path === `/categories/${category.slug}` }"
        >
          {{ pick(category.nameAr, category.nameEn) }}
        </NuxtLink>
        <NuxtLink
          v-for="category in overflowCategories"
          :key="category.slug"
          :to="`/categories/${category.slug}`"
          class="shrink-0 rounded-full px-2.5 py-1.5 text-center text-[13px] font-semibold leading-tight text-navy transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-brand md:hidden"
          :class="{ 'bg-white/80': route.path === `/categories/${category.slug}` }"
        >
          {{ pick(category.nameAr, category.nameEn) }}
        </NuxtLink>
        <div v-if="overflowCategories.length > 0" ref="moreRoot" class="relative hidden shrink-0 md:block">
          <button
            type="button"
            class="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] font-semibold leading-tight text-navy transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-brand"
            :aria-expanded="moreOpen"
            aria-haspopup="true"
            @click="moreOpen = !moreOpen; currencyOpen = false; notificationsOpen = false"
          >
            {{ t('header.more') }}
            <ChevronDown :size="12" class="shrink-0" aria-hidden="true" />
          </button>
          <div
            v-if="moreOpen"
            class="absolute end-0 top-full z-50 mt-2 w-[440px] rounded-2xl border border-line bg-white p-3 shadow-[0_12px_32px_rgba(12,40,123,0.18)]"
            :aria-label="t('header.productOptions')"
          >
            <p class="mb-2 px-1 text-xs font-black uppercase tracking-wide text-mutedtext">{{ t('header.categories') }}</p>
            <ul class="grid grid-cols-2 gap-1">
              <li v-for="category in overflowCategories" :key="category.slug">
                <NuxtLink
                  :to="`/categories/${category.slug}`"
                  class="block rounded-xl px-3 py-2 text-sm font-bold text-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {{ pick(category.nameAr, category.nameEn) }}
                </NuxtLink>
              </li>
              <li class="col-span-2 mt-1 border-t border-line pt-1">
                <NuxtLink
                  to="/products"
                  class="block rounded-xl px-3 py-2 text-sm font-bold text-brand transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {{ t('header.allProducts') }}
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
