<script setup lang="ts">
import { Plus, Trash, Save } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { adminFetchMessage } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.content.title')} — ${t('admin.nav.dashboard')}` }))

interface HeroSlideRow {
  id: string
  titleAr: string
  titleEn: string | null
  subtitleAr: string | null
  subtitleEn: string | null
  ctaLabelAr: string
  ctaLabelEn: string | null
  ctaHref: string
  imageUrl: string | null
  bgStyle: 'BLUE' | 'AMBER' | 'INK'
  sortOrder: number
  enabled: boolean
}

interface SettingsShape {
  promoHeadingAr: string | null
  promoHeadingEn: string | null
  promoBodyAr: string | null
  promoBodyEn: string | null
  promoCtaLabelAr: string | null
  promoCtaLabelEn: string | null
  promoCtaHref: string | null
  promoGradient: string | null
  promoImageUrl: string | null
  promoSecondHeadingAr: string | null
  promoSecondHeadingEn: string | null
  promoSecondBodyAr: string | null
  promoSecondBodyEn: string | null
  promoSecondCtaLabelAr: string | null
  promoSecondCtaLabelEn: string | null
  promoSecondCtaHref: string | null
  promoSecondGradient: string | null
  promoSecondImageUrl: string | null
  footerBlurbAr: string | null
  footerBlurbEn: string | null
}

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand'

const requestFetch = useRequestFetch()

const {
  data: heroData,
  pending: heroPending,
  error: heroError,
  refresh: refreshHero,
} = await useAsyncData('admin-hero-slides', () =>
  requestFetch<{ items: HeroSlideRow[] }>('/api/admin/hero-slides'),
)

const slides = ref<HeroSlideRow[]>([])
watch(
  heroData,
  (d) => {
    slides.value = (d?.items ?? []).map((s) => ({ ...s }))
  },
  { immediate: true },
)

const savingSlideKey = ref<string | null>(null)
const slideBanner = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

function slideKey(s: HeroSlideRow, index: number): string {
  return s.id || `new-${index}`
}

function addSlide() {
  slides.value.push({
    id: '',
    titleAr: '',
    titleEn: null,
    subtitleAr: null,
    subtitleEn: null,
    ctaLabelAr: '',
    ctaLabelEn: null,
    ctaHref: '',
    imageUrl: null,
    bgStyle: 'BLUE',
    sortOrder: slides.value.length,
    enabled: true,
  })
  slideBanner.value = null
}

async function saveSlide(s: HeroSlideRow, index: number) {
  const trimOrNull = (v: string | null): string | null => {
    const x = v?.trim() ?? ''
    return x === '' ? null : x
  }
  const payload = {
    titleAr: s.titleAr.trim(),
    titleEn: trimOrNull(s.titleEn),
    subtitleAr: trimOrNull(s.subtitleAr),
    subtitleEn: trimOrNull(s.subtitleEn),
    ctaLabelAr: s.ctaLabelAr.trim(),
    ctaLabelEn: trimOrNull(s.ctaLabelEn),
    ctaHref: s.ctaHref.trim(),
    imageUrl: trimOrNull(s.imageUrl),
    bgStyle: s.bgStyle,
    sortOrder: Number.isFinite(s.sortOrder) ? Math.trunc(s.sortOrder) : 0,
    enabled: s.enabled,
  }
  if (!payload.titleAr || !payload.ctaLabelAr || !payload.ctaHref) {
    slideBanner.value = { type: 'err', text: t('admin.content.slideRequired') }
    return
  }
  savingSlideKey.value = slideKey(s, index)
  slideBanner.value = null
  try {
    if (s.id) {
      await $fetch(`/api/admin/hero-slides/${s.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/admin/hero-slides', { method: 'POST', body: payload })
    }
    slideBanner.value = { type: 'ok', text: t('admin.content.slideSaved') }
    await refreshHero()
  } catch (e) {
    slideBanner.value = { type: 'err', text: adminFetchMessage(e) }
  } finally {
    savingSlideKey.value = null
  }
}

async function deleteSlide(s: HeroSlideRow, index: number) {
  if (!s.id) {
    slides.value.splice(index, 1)
    return
  }
  if (!window.confirm(t('admin.content.slideDeleteConfirm'))) return
  savingSlideKey.value = slideKey(s, index)
  slideBanner.value = null
  try {
    await $fetch(`/api/admin/hero-slides/${s.id}`, { method: 'DELETE' })
    slideBanner.value = { type: 'ok', text: t('admin.content.slideDeleted') }
    await refreshHero()
  } catch (e) {
    slideBanner.value = { type: 'err', text: adminFetchMessage(e) }
  } finally {
    savingSlideKey.value = null
  }
}

const {
  data: settingsData,
  pending: settingsPending,
  error: settingsError,
} = await useAsyncData('admin-settings', () => requestFetch<SettingsShape>('/api/admin/settings'))

const settingsForm = reactive<SettingsShape>({
  promoHeadingAr: null,
  promoHeadingEn: null,
  promoBodyAr: null,
  promoBodyEn: null,
  promoCtaLabelAr: null,
  promoCtaLabelEn: null,
  promoCtaHref: null,
  promoGradient: null,
  promoImageUrl: null,
  promoSecondHeadingAr: null,
  promoSecondHeadingEn: null,
  promoSecondBodyAr: null,
  promoSecondBodyEn: null,
  promoSecondCtaLabelAr: null,
  promoSecondCtaLabelEn: null,
  promoSecondCtaHref: null,
  promoSecondGradient: null,
  promoSecondImageUrl: null,
  footerBlurbAr: null,
  footerBlurbEn: null,
})

watch(
  settingsData,
  (d) => {
    if (d) Object.assign(settingsForm, d)
  },
  { immediate: true },
)

const savingSettings = ref(false)
const settingsBanner = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

async function saveSettings() {
  savingSettings.value = true
  settingsBanner.value = null
  const trimOrNull = (v: string | null): string | null => {
    const x = v?.trim() ?? ''
    return x === '' ? null : x
  }
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      body: {
        promoHeadingAr: trimOrNull(settingsForm.promoHeadingAr),
        promoHeadingEn: trimOrNull(settingsForm.promoHeadingEn),
        promoBodyAr: trimOrNull(settingsForm.promoBodyAr),
        promoBodyEn: trimOrNull(settingsForm.promoBodyEn),
        promoCtaLabelAr: trimOrNull(settingsForm.promoCtaLabelAr),
        promoCtaLabelEn: trimOrNull(settingsForm.promoCtaLabelEn),
        promoCtaHref: trimOrNull(settingsForm.promoCtaHref),
        promoGradient: trimOrNull(settingsForm.promoGradient),
        promoImageUrl: trimOrNull(settingsForm.promoImageUrl),
        promoSecondHeadingAr: trimOrNull(settingsForm.promoSecondHeadingAr),
        promoSecondHeadingEn: trimOrNull(settingsForm.promoSecondHeadingEn),
        promoSecondBodyAr: trimOrNull(settingsForm.promoSecondBodyAr),
        promoSecondBodyEn: trimOrNull(settingsForm.promoSecondBodyEn),
        promoSecondCtaLabelAr: trimOrNull(settingsForm.promoSecondCtaLabelAr),
        promoSecondCtaLabelEn: trimOrNull(settingsForm.promoSecondCtaLabelEn),
        promoSecondCtaHref: trimOrNull(settingsForm.promoSecondCtaHref),
        promoSecondGradient: trimOrNull(settingsForm.promoSecondGradient),
        promoSecondImageUrl: trimOrNull(settingsForm.promoSecondImageUrl),
        footerBlurbAr: trimOrNull(settingsForm.footerBlurbAr),
        footerBlurbEn: trimOrNull(settingsForm.footerBlurbEn),
      },
    })
    settingsBanner.value = { type: 'ok', text: t('admin.content.settingsSaved') }
  } catch (e) {
    settingsBanner.value = { type: 'err', text: adminFetchMessage(e) }
  } finally {
    savingSettings.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-extrabold text-navy">{{ t('admin.content.title') }}</h1>

    <section class="rounded-xl border border-line bg-white p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-bold text-navy">{{ t('admin.content.heroSection') }}</h2>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
          @click="addSlide"
        >
          <Plus class="h-4 w-4" :aria-hidden="true" />
          <span>{{ t('admin.content.addSlide') }}</span>
        </button>
      </div>

      <div
        v-if="slideBanner"
        class="mb-4 rounded-lg px-4 py-3 text-sm"
        :class="slideBanner.type === 'ok' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'"
        role="status"
      >
        {{ slideBanner.text }}
      </div>

      <div v-if="heroPending" class="py-6 text-center text-sm text-mutedtext">{{ t('common.loading') }}</div>
      <div v-else-if="heroError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ adminFetchMessage(heroError) }}
      </div>

      <div v-else class="space-y-4">
        <p v-if="slides.length === 0" class="text-sm text-mutedtext">{{ t('admin.content.noSlides') }}</p>

        <div v-for="(s, i) in slides" :key="slideKey(s, i)" class="rounded-lg border border-line p-4">
          <p class="mb-3 text-xs font-black uppercase tracking-wide text-brand">{{ t('admin.content.arFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-title-${i}`">{{ t('admin.content.fieldTitleAr') }}</label>
              <input :id="`hero-title-${i}`" v-model="s.titleAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-sub-${i}`">{{ t('admin.content.fieldSubtitleAr') }}</label>
              <input :id="`hero-sub-${i}`" v-model="s.subtitleAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-cta-${i}`">{{ t('admin.content.fieldCtaAr') }}</label>
              <input :id="`hero-cta-${i}`" v-model="s.ctaLabelAr" type="text" :class="inputClass" >
            </div>
          </div>
          <p class="mt-4 mb-3 text-xs font-black uppercase tracking-wide text-brand">{{ t('admin.content.enFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-title-en-${i}`">{{ t('admin.content.fieldTitleEn') }}</label>
              <input :id="`hero-title-en-${i}`" v-model="s.titleEn" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-sub-en-${i}`">{{ t('admin.content.fieldSubtitleEn') }}</label>
              <input :id="`hero-sub-en-${i}`" v-model="s.subtitleEn" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-cta-en-${i}`">{{ t('admin.content.fieldCtaEn') }}</label>
              <input :id="`hero-cta-en-${i}`" v-model="s.ctaLabelEn" type="text" dir="ltr" :class="inputClass" >
            </div>
          </div>
          <p class="mt-4 mb-3 text-xs font-black uppercase tracking-wide text-mutedtext">{{ t('admin.content.sharedFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-href-${i}`">{{ t('admin.content.fieldCtaHref') }}</label>
              <input :id="`hero-href-${i}`" v-model="s.ctaHref" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-img-${i}`">{{ t('admin.content.fieldImageUrl') }}</label>
              <input :id="`hero-img-${i}`" v-model="s.imageUrl" type="url" dir="ltr" :class="inputClass" >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-bg-${i}`">{{ t('admin.content.fieldBg') }}</label>
                <select :id="`hero-bg-${i}`" v-model="s.bgStyle" :class="inputClass">
                  <option value="BLUE">{{ t('admin.content.bgBlue') }}</option>
                  <option value="AMBER">{{ t('admin.content.bgAmber') }}</option>
                  <option value="INK">{{ t('admin.content.bgInk') }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-order-${i}`">{{ t('admin.content.fieldSort') }}</label>
                <input
                  :id="`hero-order-${i}`"
                  v-model.number="s.sortOrder"
                  type="number"
                  step="1"
                  dir="ltr"
                  :class="inputClass"
                >
              </div>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label class="flex items-center gap-2 text-sm text-navy">
              <input v-model="s.enabled" type="checkbox" class="h-4 w-4 rounded border-line accent-brand" >
              <span>{{ t('admin.content.enabled') }}</span>
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
                :disabled="savingSlideKey === slideKey(s, i)"
                @click="saveSlide(s, i)"
              >
                <Save class="h-4 w-4" :aria-hidden="true" />
                <span>{{ savingSlideKey === slideKey(s, i) ? t('admin.content.saving') : t('common.save') }}</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                :disabled="savingSlideKey === slideKey(s, i)"
                @click="deleteSlide(s, i)"
              >
                <Trash class="h-4 w-4" :aria-hidden="true" />
                <span>{{ t('common.delete') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-line bg-white p-5">
      <h2 class="mb-4 text-base font-bold text-navy">{{ t('admin.content.settingsSection') }}</h2>

      <div
        v-if="settingsBanner"
        class="mb-4 rounded-lg px-4 py-3 text-sm"
        :class="settingsBanner.type === 'ok' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'"
        role="status"
      >
        {{ settingsBanner.text }}
      </div>

      <div v-if="settingsPending" class="py-6 text-center text-sm text-mutedtext">{{ t('common.loading') }}</div>
      <div v-else-if="settingsError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ adminFetchMessage(settingsError) }}
      </div>

      <div v-else class="space-y-6">
        <div>
          <h3 class="mb-3 text-sm font-bold text-navy">{{ t('admin.content.promo1') }}</h3>
          <p class="mb-3 text-xs font-black uppercase tracking-wide text-brand">{{ t('admin.content.arFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p1-title" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldTitleAr') }}</label>
              <input id="set-p1-title" v-model="settingsForm.promoHeadingAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-body" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldBodyAr') }}</label>
              <input id="set-p1-body" v-model="settingsForm.promoBodyAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-cta" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldCtaAr') }}</label>
              <input id="set-p1-cta" v-model="settingsForm.promoCtaLabelAr" type="text" :class="inputClass" >
            </div>
          </div>
          <p class="mt-4 mb-3 text-xs font-black uppercase tracking-wide text-brand">{{ t('admin.content.enFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p1-title-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldTitleEn') }}</label>
              <input id="set-p1-title-en" v-model="settingsForm.promoHeadingEn" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-body-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldBodyEn') }}</label>
              <input id="set-p1-body-en" v-model="settingsForm.promoBodyEn" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-cta-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldCtaEn') }}</label>
              <input id="set-p1-cta-en" v-model="settingsForm.promoCtaLabelEn" type="text" dir="ltr" :class="inputClass" >
            </div>
          </div>
          <p class="mt-4 mb-3 text-xs font-black uppercase tracking-wide text-mutedtext">{{ t('admin.content.sharedFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p1-href" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldCtaHref') }}</label>
              <input id="set-p1-href" v-model="settingsForm.promoCtaHref" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-gradient" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldGradient') }}</label>
              <select id="set-p1-gradient" v-model="settingsForm.promoGradient" :class="inputClass">
                <option value="navy">{{ t('admin.content.gradNavy') }}</option>
                <option value="amber">{{ t('admin.content.gradAmber') }}</option>
              </select>
            </div>
            <div>
              <label for="set-p1-img" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldImageUrl') }}</label>
              <input id="set-p1-img" v-model="settingsForm.promoImageUrl" type="url" dir="ltr" :class="inputClass" >
            </div>
          </div>
        </div>

        <div>
          <h3 class="mb-3 text-sm font-bold text-navy">{{ t('admin.content.promo2') }}</h3>
          <p class="mb-3 text-xs font-black uppercase tracking-wide text-brand">{{ t('admin.content.arFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p2-title" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldTitleAr') }}</label>
              <input id="set-p2-title" v-model="settingsForm.promoSecondHeadingAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-body" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldBodyAr') }}</label>
              <input id="set-p2-body" v-model="settingsForm.promoSecondBodyAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-cta" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldCtaAr') }}</label>
              <input id="set-p2-cta" v-model="settingsForm.promoSecondCtaLabelAr" type="text" :class="inputClass" >
            </div>
          </div>
          <p class="mt-4 mb-3 text-xs font-black uppercase tracking-wide text-brand">{{ t('admin.content.enFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p2-title-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldTitleEn') }}</label>
              <input id="set-p2-title-en" v-model="settingsForm.promoSecondHeadingEn" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-body-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldBodyEn') }}</label>
              <input id="set-p2-body-en" v-model="settingsForm.promoSecondBodyEn" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-cta-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldCtaEn') }}</label>
              <input id="set-p2-cta-en" v-model="settingsForm.promoSecondCtaLabelEn" type="text" dir="ltr" :class="inputClass" >
            </div>
          </div>
          <p class="mt-4 mb-3 text-xs font-black uppercase tracking-wide text-mutedtext">{{ t('admin.content.sharedFields') }}</p>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p2-href" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldCtaHref') }}</label>
              <input id="set-p2-href" v-model="settingsForm.promoSecondCtaHref" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-gradient" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldGradient') }}</label>
              <select id="set-p2-gradient" v-model="settingsForm.promoSecondGradient" :class="inputClass">
                <option value="navy">{{ t('admin.content.gradNavy') }}</option>
                <option value="amber">{{ t('admin.content.gradAmber') }}</option>
              </select>
            </div>
            <div>
              <label for="set-p2-img" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.fieldImageUrl') }}</label>
              <input id="set-p2-img" v-model="settingsForm.promoSecondImageUrl" type="url" dir="ltr" :class="inputClass" >
            </div>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label for="set-footer" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.footerBlurbAr') }}</label>
            <textarea id="set-footer" v-model="settingsForm.footerBlurbAr" rows="3" dir="rtl" :class="inputClass" />
          </div>
          <div>
            <label for="set-footer-en" class="mb-1 block text-xs font-semibold text-mutedtext">{{ t('admin.content.footerBlurbEn') }}</label>
            <textarea id="set-footer-en" v-model="settingsForm.footerBlurbEn" rows="3" dir="ltr" :class="inputClass" />
          </div>
        </div>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
          :disabled="savingSettings"
          @click="saveSettings"
        >
          <Save class="h-4 w-4" :aria-hidden="true" />
          <span>{{ savingSettings ? t('admin.content.saving') : t('admin.content.saveSettings') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
