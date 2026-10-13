<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import AdminProductForm from '~/components/admin/ProductForm.vue'
import type { AdminProductFormValue } from '~/types/admin-product-form'
import { adminFetchMessage } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })

const { t } = useI18n()

useHead(() => ({ title: `${t('products.newTitle')} — ${t('header.brand')}` }))

const saving = ref(false)
const serverError = ref<string | null>(null)

async function onSubmit(payload: AdminProductFormValue) {
  saving.value = true
  serverError.value = null
  try {
    await $fetch('/api/admin/products', { method: 'POST', body: payload })
    await navigateTo('/admin/products')
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
    <h1 class="text-2xl font-extrabold text-navy">{{ t('products.newHeading') }}</h1>
    <AdminProductForm :saving="saving" :server-error="serverError" @submit="onSubmit" />
  </div>
</template>
