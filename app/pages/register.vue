<script setup lang="ts">
import { User, CircleAlert } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead(() => ({ title: `${t('register.metaTitle')} — ${t('header.brand')}` }))

const route = useRoute()
const { register } = useAuth()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive<{
  name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  form?: string
}>({})
const submitting = ref(false)

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/account'
})

function validate(): boolean {
  errors.name = undefined
  errors.email = undefined
  errors.phone = undefined
  errors.password = undefined
  errors.confirmPassword = undefined
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const phonePattern = /^01[0-5]\d{8}$/
  let valid = true

  if (!form.name.trim()) {
    errors.name = t('register.nameRequired')
    valid = false
  } else if (form.name.trim().length < 2) {
    errors.name = t('register.nameShort')
    valid = false
  }

  if (!form.email.trim()) {
    errors.email = t('register.emailRequired')
    valid = false
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = t('register.emailInvalid')
    valid = false
  }

  if (form.phone.trim() && !phonePattern.test(form.phone.trim())) {
    errors.phone = t('register.phoneInvalid')
    valid = false
  }

  if (!form.password) {
    errors.password = t('register.passwordRequired')
    valid = false
  } else if (form.password.length < 8) {
    errors.password = t('register.passwordMin')
    valid = false
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = t('common.passwordMismatch')
    valid = false
  }

  return valid
}

async function submit() {
  if (submitting.value) return
  delete errors.form
  if (!validate()) return
  submitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
    }
    await register(payload)
    await navigateTo(redirectTarget.value)
  } catch {
    errors.form = t('register.error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-[440px] flex-col px-4 py-12 md:py-20">
    <div class="mb-8 text-center">
      <span class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-navy text-neon">
        <User :size="24" aria-hidden="true" />
      </span>
      <h1 class="text-2xl font-extrabold text-navy">{{ t('register.title') }}</h1>
      <p class="mt-2 text-sm text-mutedtext">{{ t('register.subtitle') }}</p>
    </div>

    <form class="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6" novalidate @submit.prevent="submit">
      <FormField :label="t('register.name')" for-id="register-name" :error="errors.name">
        <input
          id="register-name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.name ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <FormField :label="t('register.email')" for-id="register-email" :error="errors.email">
        <input
          id="register-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          dir="ltr"
          class="h-11 w-full rounded-xl border px-3.5 text-start text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.email ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <FormField :label="t('register.phone')" for-id="register-phone" :error="errors.phone">
        <input
          id="register-phone"
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

      <FormField :label="t('register.password')" for-id="register-password" :error="errors.password">
        <input
          id="register-password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.password ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <FormField :label="t('register.confirmPassword')" for-id="register-confirm" :error="errors.confirmPassword">
        <input
          id="register-confirm"
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.confirmPassword ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <p
        v-if="errors.form"
        class="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        role="alert"
      >
        <CircleAlert :size="16" class="shrink-0" aria-hidden="true" />
        {{ errors.form }}
      </p>

      <button
        type="submit"
        class="flex h-12 w-full items-center justify-center rounded-xl bg-neon text-sm font-black text-brand-alt transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand"
        :disabled="submitting"
      >
        {{ submitting ? t('register.submitting') : t('register.submit') }}
      </button>

      <p class="text-center text-sm text-mutedtext">
        {{ t('register.hasAccount') }}
        <NuxtLink
          :to="{ path: '/login', query: { redirect: redirectTarget } }"
          class="font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {{ t('register.signIn') }}
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
