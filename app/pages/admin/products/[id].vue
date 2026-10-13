<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import AdminProductForm from '~/components/admin/ProductForm.vue'
import type { AdminProductFormValue } from '~/types/admin-product-form'
import { adminFetchMessage } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()
const { pick } = useLocalized()

useHead(() => ({ title: `${t('products.editTitle')} — ${t('header.brand')}` }))

interface AdminProductDetail {
  id: string
  slug: string
  titleAr: string
  titleEn: string | null
  descriptionAr: string
  priceCents: string
  compareAtCents: string | null
  status: string
  categoryId: string
  images: string[]
  variants: {
    id?: string
    sku: string
    size: string | null
    color: string | null
    colorHex: string | null
    priceCents: string | null
    stock: number
    imageUrl: string | null
  }[]
}

const route = useRoute()
const productId = computed(() => String(route.params.id))

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  `admin-product-${productId.value}`,
  () => requestFetch<AdminProductDetail>(`/api/admin/products/${productId.value}`),
)

const saving = ref(false)
const serverError = ref<string | null>(null)
const saved = ref(false)

async function onSubmit(payload: AdminProductFormValue) {
  saving.value = true
  serverError.value = null
  saved.value = false
  try {
    await $fetch(`/api/admin/products/${productId.value}`, { method: 'PATCH', body: payload })
    saved.value = true
    await refresh()
  } catch (e) {
    serverError.value = adminFetchMessage(e, t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <NuxtLink
      to="/admin/products"
      class="inline-flex items-center gap-1.5 text-sm text-brand transition-colors hover:underline"
    >
      <ArrowRight class="h-4 w-4" :aria-hidden="true" />
      <span>{{ t('products.back') }}</span>
    </NuxtLink>

    <h1 class="text-2xl font-extrabold text-navy">
      {{ t('products.editTitle') }}<span v-if="data"> — {{ pick(data.titleAr, data.titleEn) }}</span>
    </h1>

    <div v-if="pending" class="rounded-xl border border-line bg-white p-8 text-center text-sm text-mutedtext">
      {{ t('products.loadDetail') }}
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700" role="alert">
      <p>{{ adminFetchMessage(error, t('common.operationFailed')) }}</p>
      <button
        type="button"
        class="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <template v-else-if="data">
      <div
        v-if="saved"
        class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        role="status"
      >
        {{ t('products.saved') }}
      </div>
      <AdminProductForm :initial="data" :saving="saving" :server-error="serverError" @submit="onSubmit" />
    </template>
  </div>
</template>
