<script setup lang="ts">
import { ShoppingBag } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { EGYPT_GOVERNORATES } from '#shared/utils/governorates'

const { t } = useI18n()

useHead(() => ({ title: `${t('checkout.title')} — ${t('header.brand')}` }))

const { cart, cartLoaded, refresh, subtotalCents } = useCart()
const { formatBase } = useCurrency()
const { user } = useAuth()
const route = useRoute()

const form = reactive({
  email: '',
  name: '',
  phone: '',
  governorate: EGYPT_GOVERNORATES[0],
  addressLine: '',
  notes: '',
})

const errors = reactive<{ email?: string; name?: string; phone?: string; governorate?: string; addressLine?: string }>({})
const submitting = ref(false)
const submitError = ref<string | null>(null)
const idempotencyKey = ref('')

onMounted(() => {
  refresh()
  if (!idempotencyKey.value) {
    idempotencyKey.value = crypto.randomUUID()
  }
})

watch(user, (value) => {
  if (value) {
    if (!form.name) form.name = value.name
    if (!form.email) form.email = value.email
  }
}, { immediate: true })

const items = computed(() => cart.value.items)
const subtotal = computed(() => formatBase(subtotalCents.value))

function validate(): boolean {
  errors.email = undefined
  errors.name = undefined
  errors.phone = undefined
  errors.governorate = undefined
  errors.addressLine = undefined
  let valid = true
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const phonePattern = /^01[0-5]\d{8}$/

  if (!form.email.trim()) errors.email = t('checkout.emailRequired')
  else if (!emailPattern.test(form.email.trim())) errors.email = t('checkout.emailInvalid')

  if (!form.name.trim()) errors.name = t('checkout.nameRequired')
  else if (form.name.trim().length < 2) errors.name = t('checkout.nameShort')

  if (!form.phone.trim()) errors.phone = t('checkout.phoneRequired')
  else if (!phonePattern.test(form.phone.trim())) errors.phone = t('checkout.phoneInvalid')

  if (!form.governorate) errors.governorate = t('checkout.governorateRequired')

  if (!form.addressLine.trim()) errors.addressLine = t('checkout.addressRequired')
  else if (form.addressLine.trim().length < 5) errors.addressLine = t('checkout.addressShort')

  valid =
    !errors.email &&
    !errors.name &&
    !errors.phone &&
    !errors.governorate &&
    !errors.addressLine
  return valid
}

function errParts(error: unknown): { status: number | null; statusMessage: string } {
  let status: number | null = null
  let statusMessage = ''
  if (typeof error === 'object' && error !== null) {
    if ('statusCode' in error && typeof error.statusCode === 'number') status = error.statusCode
    if ('statusMessage' in error && typeof error.statusMessage === 'string') statusMessage = error.statusMessage
  }
  return { status, statusMessage }
}

function arabicFor(code: string): string {
  if (code === 'EMPTY_CART') return t('checkout.errEmptyCart')
  if (code === 'OUT_OF_STOCK') return t('checkout.errOutOfStock')
  if (code === 'VALIDATION_ERROR') return t('checkout.errValidation')
  if (code === 'VALID_PHONE') return t('checkout.phoneInvalid')
  return t('checkout.errGeneric')
}

async function submit() {
  if (submitting.value || items.value.length === 0) return
  if (!validate()) return
  submitting.value = true
  submitError.value = null
  try {
    const payload = {
      email: form.email.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      governorate: form.governorate,
      addressLine: form.addressLine.trim(),
      notes: form.notes.trim() || undefined,
    }
    const res = await $fetch<{ orderNumber: string; totalCents: string }>('/api/checkout', {
      method: 'POST',
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey.value },
    })
    await navigateTo({ path: '/checkout/success', query: { order: res.orderNumber } })
  } catch (error) {
    const { status, statusMessage } = errParts(error)
    submitError.value = arabicFor(statusMessage)
    if (status === 401) {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
      return
    }
    if (status === 400 || status === 409) {
      await refresh()
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <h1 class="mb-6 text-2xl font-extrabold text-navy md:text-3xl">{{ t('checkout.title') }}</h1>

    <EmptyState
      v-if="cartLoaded && items.length === 0"
      :title="t('checkout.emptyTitle')"
      :hint="t('checkout.emptyHint')"
      :action-label="t('common.shopNow')"
      action-href="/products"
      :icon="ShoppingBag"
    />

    <div v-else class="grid gap-8 lg:grid-cols-[1fr_340px]">
      <form class="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6" novalidate @submit.prevent="submit">
        <h2 class="text-base font-extrabold text-navy">{{ t('checkout.deliveryTitle') }}</h2>

        <FormField :label="t('checkout.name')" for-id="checkout-name" :error="errors.name">
          <input
            id="checkout-name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
            :class="errors.name ? 'border-red-400' : 'border-line'"
          >
        </FormField>

        <FormField :label="t('checkout.email')" for-id="checkout-email" :error="errors.email">
          <input
            id="checkout-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            dir="ltr"
            class="h-11 w-full rounded-xl border px-3.5 text-start text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
            :class="errors.email ? 'border-red-400' : 'border-line'"
          >
        </FormField>

        <FormField :label="t('checkout.phone')" for-id="checkout-phone" :error="errors.phone">
          <input
            id="checkout-phone"
            v-model="form.phone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            dir="ltr"
            placeholder="01xxxxxxxxx"
            class="h-11 w-full rounded-xl border px-3.5 text-start text-sm text-navy placeholder:text-mutedtext focus-visible:outline-2 focus-visible:outline-brand"
            :class="errors.phone ? 'border-red-400' : 'border-line'"
          >
        </FormField>

        <FormField :label="t('checkout.governorate')" for-id="checkout-governorate" :error="errors.governorate">
          <select
            id="checkout-governorate"
            v-model="form.governorate"
            class="h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
            :class="errors.governorate ? 'border-red-400' : 'border-line'"
          >
            <option v-for="gov in EGYPT_GOVERNORATES" :key="gov" :value="gov">{{ gov }}</option>
          </select>
        </FormField>

        <FormField :label="t('checkout.address')" for-id="checkout-address" :error="errors.addressLine">
          <textarea
            id="checkout-address"
            v-model="form.addressLine"
            rows="3"
            autocomplete="street-address"
            class="w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
            :class="errors.addressLine ? 'border-red-400' : 'border-line'"
          />
        </FormField>

        <FormField :label="t('checkout.notes')" for-id="checkout-notes">
          <textarea
            id="checkout-notes"
            v-model="form.notes"
            rows="2"
            class="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          />
        </FormField>

        <p
          v-if="submitError"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {{ submitError }}
        </p>

        <button
          type="submit"
          class="flex h-12 w-full items-center justify-center rounded-xl bg-neon text-sm font-black text-brand-alt transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand"
          :disabled="submitting || items.length === 0"
        >
          {{ submitting ? t('checkout.submitting') : t('checkout.submit') }}
        </button>
        <p class="text-center text-xs text-mutedtext">
          {{ t('checkout.note') }}
        </p>
      </form>

      <aside>
        <div class="rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-44">
          <h2 class="mb-4 text-base font-extrabold text-navy">{{ t('checkout.yourOrder') }}</h2>
          <ul class="mb-4 flex max-h-72 flex-col gap-3 overflow-y-auto pe-1">
            <li v-for="item in items" :key="item.id" class="flex items-center gap-3 text-sm">
              <span class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#FAFAFA]">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.productTitleAr"
                  loading="lazy"
                  class="h-full w-full object-contain"
                >
              </span>
              <span class="min-w-0 flex-1">
                <span class="line-clamp-1 font-bold text-navy">{{ item.productTitleAr }}</span>
                <span class="text-xs text-mutedtext">× {{ item.quantity }}</span>
              </span>
              <span class="shrink-0 font-bold text-navy">{{ formatBase(item.lineTotalCents) }}</span>
            </li>
          </ul>
          <div class="border-t border-line pt-4">
            <div class="flex items-center justify-between">
              <span class="font-bold text-navy">{{ t('checkout.subtotal') }}</span>
              <span class="text-lg font-black text-navy">{{ subtotal }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
