<script setup lang="ts">
import { KeyRound, CircleAlert } from '@lucide/vue'

useHead({ title: 'تسجيل الدخول — نِمبوس مارت' })

const route = useRoute()
const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string; form?: string }>({})
const submitting = ref(false)

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/account'
})

function validate(): boolean {
  delete errors.email
  delete errors.password
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  let valid = true
  if (!form.email.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب'
    valid = false
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = 'بريد إلكتروني غير صحيح'
    valid = false
  }
  if (!form.password) {
    errors.password = 'كلمة المرور مطلوبة'
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
    await login(form.email.trim(), form.password)
    await navigateTo(redirectTarget.value)
  } catch {
    errors.form = 'بيانات الدخول غير صحيحة، حاول مرة أخرى.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-[440px] flex-col px-4 py-12 md:py-20">
    <div class="mb-8 text-center">
      <span class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-navy text-neon">
        <KeyRound :size="24" aria-hidden="true" />
      </span>
      <h1 class="text-2xl font-extrabold text-navy">تسجيل الدخول</h1>
      <p class="mt-2 text-sm text-mutedtext">أهلاً بعودتك إلى نِمبوس مارت</p>
    </div>

    <form class="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6" novalidate @submit.prevent="submit">
      <FormField label="البريد الإلكتروني" for-id="login-email" :error="errors.email">
        <input
          id="login-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          dir="ltr"
          class="h-11 w-full rounded-xl border px-3.5 text-start text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.email ? 'border-red-400' : 'border-line'"
        >
      </FormField>

      <FormField label="كلمة المرور" for-id="login-password" :error="errors.password">
        <input
          id="login-password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
          :class="errors.password ? 'border-red-400' : 'border-line'"
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
        {{ submitting ? 'جاري الدخول…' : 'دخول' }}
      </button>

      <p class="text-center text-sm text-mutedtext">
        ليس لديك حساب؟
        <NuxtLink
          :to="{ path: '/register', query: { redirect: redirectTarget } }"
          class="font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
        >
          أنشئ حساباً جديداً
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
