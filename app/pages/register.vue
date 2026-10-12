<script setup lang="ts">
import { User, CircleAlert } from '@lucide/vue'

useHead({ title: 'إنشاء حساب — نِمبوس مارت' })

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
    errors.name = 'الاسم مطلوب'
    valid = false
  } else if (form.name.trim().length < 2) {
    errors.name = 'الاسم قصير جداً'
    valid = false
  }

  if (!form.email.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب'
    valid = false
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = 'بريد إلكتروني غير صحيح'
    valid = false
  }

  if (form.phone.trim() && !phonePattern.test(form.phone.trim())) {
    errors.phone = 'رقم موبايل غير صحيح'
    valid = false
  }

  if (!form.password) {
    errors.password = 'كلمة المرور مطلوبة'
    valid = false
  } else if (form.password.length < 8) {
    errors.password = 'كلمة المرور يجب ألا تقل عن 8 أحرف'
    valid = false
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'كلمتا المرور غير متطابقتين'
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
    errors.form = 'تعذّر إنشاء الحساب، تأكد أن البريد غير مُستخدم مسبقاً.'
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
      <h1 class="text-2xl font-extrabold text-navy">إنشاء حساب جديد</h1>
      <p class="mt-2 text-sm text-mutedtext">انضم إلى نِمبوس مارت وتسوّق بسهولة</p>
    </div>

    <form class="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6" novalidate @submit.prevent="submit">
      <FormField label="الاسم بالكامل" for-id="register-name" :error="errors.name">
        <input
          id="register-name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.name ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <FormField label="البريد الإلكتروني" for-id="register-email" :error="errors.email">
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

      <FormField label="رقم الموبايل (اختياري)" for-id="register-phone" :error="errors.phone">
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

      <FormField label="كلمة المرور" for-id="register-password" :error="errors.password">
        <input
          id="register-password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.password ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <FormField label="تأكيد كلمة المرور" for-id="register-confirm" :error="errors.confirmPassword">
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
        {{ submitting ? 'جاري إنشاء الحساب…' : 'إنشاء الحساب' }}
      </button>

      <p class="text-center text-sm text-mutedtext">
        لديك حساب بالفعل؟
        <NuxtLink
          :to="{ path: '/login', query: { redirect: redirectTarget } }"
          class="font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
        >
          سجّل الدخول
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
