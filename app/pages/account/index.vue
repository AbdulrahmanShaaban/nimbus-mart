<script setup lang="ts">
import { ListOrdered, LogOut, CircleCheck, CircleAlert } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { AccountDto } from '~/types/api'

const { t } = useI18n()
const { adminFormatDate } = useAdminDateFormat()

definePageMeta({ middleware: ['auth'] })
useHead(() => ({ title: `${t('header.account')} — ${t('header.brand')}` }))

const { user, logout } = useAuth()

const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData('account', () => requestFetch<AccountDto>('/api/account'))

const profile = reactive({ name: '', phone: '' })
watch(
  data,
  (value) => {
    if (value) {
      profile.name = value.name
      profile.phone = value.phone ?? ''
    }
  },
  { immediate: true },
)

const profileErrors = reactive<{ name?: string; phone?: string }>({})
const profileSaved = ref(false)
const profileSaving = ref(false)

const password = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordErrors = reactive<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({})
const passwordSaved = ref(false)
const passwordSaving = ref(false)
const passwordFormError = ref<string | null>(null)

async function saveProfile() {
  if (profileSaving.value) return
  profileSaved.value = false
  delete profileErrors.name
  delete profileErrors.phone
  let valid = true
  if (profile.name.trim().length < 2) {
    profileErrors.name = t('account.nameShort')
    valid = false
  }
  if (profile.phone.trim() && !/^01[0-5]\d{8}$/.test(profile.phone.trim())) {
    profileErrors.phone = t('account.phoneInvalid')
    valid = false
  }
  if (!valid) return
  profileSaving.value = true
  try {
    const updated = await $fetch<AccountDto>('/api/account', {
      method: 'PATCH',
      body: { name: profile.name.trim(), phone: profile.phone.trim() },
    })
    data.value = updated
    if (user.value) {
      user.value = { ...user.value, name: updated.name }
    }
    profileSaved.value = true
  } catch {
    profileErrors.name = t('account.saveError')
  } finally {
    profileSaving.value = false
  }
}

async function savePassword() {
  if (passwordSaving.value) return
  passwordSaved.value = false
  passwordFormError.value = null
  passwordErrors.currentPassword = undefined
  passwordErrors.newPassword = undefined
  passwordErrors.confirmPassword = undefined
  let valid = true
  if (!password.currentPassword) {
    passwordErrors.currentPassword = t('account.currentPasswordRequired')
    valid = false
  }
  if (password.newPassword.length < 8) {
    passwordErrors.newPassword = t('account.newPasswordMin')
    valid = false
  }
  if (password.confirmPassword !== password.newPassword) {
    passwordErrors.confirmPassword = t('common.passwordMismatch')
    valid = false
  }
  if (!valid) return
  passwordSaving.value = true
  try {
    await $fetch('/api/account/password', {
      method: 'PATCH',
      body: { currentPassword: password.currentPassword, newPassword: password.newPassword },
    })
    password.currentPassword = ''
    password.newPassword = ''
    password.confirmPassword = ''
    passwordSaved.value = true
  } catch (err) {
    let status: number | null = null
    if (typeof err === 'object' && err !== null && 'statusCode' in err && typeof err.statusCode === 'number') {
      status = err.statusCode
    }
    passwordFormError.value =
      status === 401 ? t('account.currentPasswordWrong') : t('account.passwordUpdateError')
  } finally {
    passwordSaving.value = false
  }
}

async function onLogout() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-extrabold text-navy md:text-3xl">{{ t('header.account') }}</h1>
      <NuxtLink
        to="/account/orders"
        class="flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ListOrdered :size="16" aria-hidden="true" />
        {{ t('account.orders') }}
      </NuxtLink>
    </div>

    <div v-if="pending" class="text-sm text-mutedtext" aria-live="polite">{{ t('common.loading') }}</div>

    <div v-else-if="error || !data" class="rounded-2xl border border-line bg-white p-8 text-center" role="alert">
      <p class="mb-1 font-bold text-navy">{{ t('account.errorTitle') }}</p>
      <p class="mb-4 text-sm text-mutedtext">{{ t('account.errorHint') }}</p>
      <button
        type="button"
        class="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand"
        @click="refresh()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <section class="rounded-2xl border border-line bg-white p-6">
        <h2 class="mb-4 text-base font-extrabold text-navy">{{ t('account.personalInfo') }}</h2>
        <dl class="mb-5 flex flex-col gap-2 text-sm">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-bodytext">{{ t('account.emailLabel') }}</dt>
            <dd class="font-bold text-navy" dir="ltr">{{ data.email }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-bodytext">{{ t('account.memberSince') }}</dt>
            <dd class="font-bold text-navy">{{ adminFormatDate(data.createdAt) }}</dd>
          </div>
        </dl>

        <form class="flex flex-col gap-4" novalidate @submit.prevent="saveProfile">
          <FormField :label="t('account.nameLabel')" for-id="account-name" :error="profileErrors.name">
            <input
              id="account-name"
              v-model="profile.name"
              type="text"
              autocomplete="name"
              class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
              :class="profileErrors.name ? 'border-red-400' : 'border-line'"
            >
          </FormField>
          <FormField :label="t('account.phoneLabel')" for-id="account-phone" :error="profileErrors.phone">
            <input
              id="account-phone"
              v-model="profile.phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              dir="ltr"
              placeholder="01xxxxxxxxx"
              class="h-11 w-full rounded-xl border px-3.5 text-start text-sm text-navy placeholder:text-mutedtext focus-visible:outline-2 focus-visible:outline-brand"
              :class="profileErrors.phone ? 'border-red-400' : 'border-line'"
            >
          </FormField>
          <p
            v-if="profileSaved"
            class="flex items-center gap-2 text-sm font-semibold text-emerald-700"
            role="status"
          >
            <CircleCheck :size="16" aria-hidden="true" />
            {{ t('account.profileSaved') }}
          </p>
          <button
            type="submit"
            class="h-11 w-full rounded-xl bg-navy text-sm font-bold text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand"
            :disabled="profileSaving"
          >
            {{ profileSaving ? t('account.saving') : t('account.saveChanges') }}
          </button>
        </form>
      </section>

      <section class="rounded-2xl border border-line bg-white p-6">
        <h2 class="mb-4 text-base font-extrabold text-navy">{{ t('account.changePassword') }}</h2>
        <form class="flex flex-col gap-4" novalidate @submit.prevent="savePassword">
          <FormField :label="t('account.currentPassword')" for-id="account-current-password" :error="passwordErrors.currentPassword">
            <input
              id="account-current-password"
              v-model="password.currentPassword"
              type="password"
              autocomplete="current-password"
              class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
              :class="passwordErrors.currentPassword ? 'border-red-400' : 'border-line'"
            >
          </FormField>
          <FormField :label="t('account.newPassword')" for-id="account-new-password" :error="passwordErrors.newPassword">
            <input
              id="account-new-password"
              v-model="password.newPassword"
              type="password"
              autocomplete="new-password"
              class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
              :class="passwordErrors.newPassword ? 'border-red-400' : 'border-line'"
            >
          </FormField>
          <FormField :label="t('account.confirmNewPassword')" for-id="account-confirm-password" :error="passwordErrors.confirmPassword">
            <input
              id="account-confirm-password"
              v-model="password.confirmPassword"
              type="password"
              autocomplete="new-password"
              class="h-11 w-full rounded-xl border px-3.5 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand"
              :class="passwordErrors.confirmPassword ? 'border-red-400' : 'border-line'"
            >
          </FormField>
          <p
            v-if="passwordFormError"
            class="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            role="alert"
          >
            <CircleAlert :size="16" class="shrink-0" aria-hidden="true" />
            {{ passwordFormError }}
          </p>
          <p
            v-if="passwordSaved"
            class="flex items-center gap-2 text-sm font-semibold text-emerald-700"
            role="status"
          >
            <CircleCheck :size="16" aria-hidden="true" />
            {{ t('account.passwordUpdated') }}
          </p>
          <button
            type="submit"
            class="h-11 w-full rounded-xl bg-navy text-sm font-bold text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-brand"
            :disabled="passwordSaving"
          >
            {{ passwordSaving ? t('account.updatingPassword') : t('account.updatePassword') }}
          </button>
        </form>

        <button
          type="button"
          class="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-brand"
          @click="onLogout"
        >
          <LogOut :size="16" aria-hidden="true" />
          {{ t('header.logout') }}
        </button>
      </section>
    </div>
  </div>
</template>
