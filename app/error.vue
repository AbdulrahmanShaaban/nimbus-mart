<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'

const props = defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>()

const is404 = computed(() => props.error?.statusCode === 404)

useHead({ title: is404.value ? 'الصفحة غير موجودة — نِمبوس مارت' : 'حدث خطأ — نِمبوس مارت' })

const title = computed(() => (is404.value ? 'الصفحة غير موجودة' : 'حدث خطأ غير متوقع'))
const hint = computed(() =>
  is404.value
    ? 'ربما تم نقل الصفحة أو أن الرابط غير صحيح.'
    : 'نأسف للإزعاج، حاول مرة أخرى بعد قليل.',
)
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-surface px-4">
    <div class="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <span class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700">
        <TriangleAlert :size="30" aria-hidden="true" />
      </span>
      <p class="mb-1 text-sm font-bold text-brand">
        {{ props.error?.statusCode ?? 500 }}
      </p>
      <h1 class="mb-2 text-2xl font-extrabold text-navy">{{ title }}</h1>
      <p class="mb-6 text-sm leading-relaxed text-mutedtext">{{ hint }}</p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="flex h-11 items-center rounded-xl bg-navy px-6 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
          @click="clearError({ redirect: '/' })"
        >
          العودة للرئيسية
        </button>
        <button
          type="button"
          class="flex h-11 items-center rounded-xl border border-line px-6 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
          @click="clearError()"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  </div>
</template>
