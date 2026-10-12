<script setup lang="ts">
import type { Component } from 'vue'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LayoutTemplate,
  Coins,
  ScrollText,
  ExternalLink,
  LogOut,
} from '@lucide/vue'

const route = useRoute()
const { logout } = useAuth()
const { loadRates } = useCurrency()

interface AdminNav {
  label: string
  href: string
  icon: Component
}

const nav: AdminNav[] = [
  { label: 'لوحة القيادة', href: '/admin', icon: LayoutDashboard },
  { label: 'المنتجات', href: '/admin/products', icon: Package },
  { label: 'الطلبات', href: '/admin/orders', icon: ShoppingCart },
  { label: 'العملاء', href: '/admin/users', icon: Users },
  { label: 'المحتوى', href: '/admin/content', icon: LayoutTemplate },
  { label: 'العملات', href: '/admin/currencies', icon: Coins },
  { label: 'سجل التدقيق', href: '/admin/audit', icon: ScrollText },
]

function isActive(href: string): boolean {
  if (href === '/admin') return route.path === '/admin'
  return route.path === href || route.path.startsWith(`${href}/`)
}

async function onLogout() {
  try {
    await logout()
  } finally {
    await navigateTo('/login')
  }
}

onMounted(() => {
  void loadRates()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface/40 md:flex-row">
    <aside class="sticky top-0 z-30 hidden w-64 shrink-0 flex-col bg-navy-deep text-white md:sticky md:flex md:h-screen">
      <div class="border-b border-white/10 px-5 py-6">
        <p class="text-lg font-extrabold">
          NIMBUS<span class="text-neon">.</span>
        </p>
        <p class="mt-1 text-sm text-white/70">لوحة التحكم</p>
      </div>
      <nav class="flex-1 overflow-y-auto py-4">
        <NuxtLink
          v-for="item in nav"
          :key="item.href"
          :to="item.href"
          class="flex items-center gap-3 border-s-2 px-5 py-2.5 text-sm transition-colors"
          :class="
            isActive(item.href)
              ? 'border-neon bg-white/10 font-semibold text-white'
              : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
          "
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" :aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="space-y-2 border-t border-white/10 p-4">
        <NuxtLink to="/" class="flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white">
          <ExternalLink class="h-4 w-4" :aria-hidden="true" />
          <span>عرض المتجر</span>
        </NuxtLink>
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
          @click="onLogout"
        >
          <LogOut class="h-4 w-4" :aria-hidden="true" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    <div class="sticky top-0 z-30 bg-navy-deep text-white md:hidden">
      <div class="flex items-center justify-between px-4 py-3">
        <p class="font-extrabold">
          NIMBUS<span class="text-neon">.</span> لوحة التحكم
        </p>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10"
          aria-label="تسجيل الخروج"
          @click="onLogout"
        >
          <LogOut class="h-4 w-4" :aria-hidden="true" />
        </button>
      </div>
      <nav class="flex gap-1 overflow-x-auto px-2 pb-2">
        <NuxtLink
          v-for="item in nav"
          :key="item.href"
          :to="item.href"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors"
          :class="isActive(item.href) ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'"
        >
          <component :is="item.icon" class="h-4 w-4" :aria-hidden="true" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <main class="min-w-0 flex-1">
      <div class="mx-auto max-w-7xl p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
