<script setup lang="ts">
import { Plus, Trash, Save } from '@lucide/vue'
import { adminFetchMessage } from '~/utils/admin-status'

definePageMeta({ middleware: ['admin'], layout: 'admin' })
useHead({ title: 'المحتوى — لوحة التحكم' })

interface HeroSlideRow {
  id: string
  titleAr: string
  subtitleAr: string | null
  ctaLabelAr: string
  ctaHref: string
  imageUrl: string | null
  bgStyle: 'BLUE' | 'AMBER' | 'INK'
  sortOrder: number
  enabled: boolean
}

interface SettingsShape {
  promoHeadingAr: string | null
  promoBodyAr: string | null
  promoCtaLabelAr: string | null
  promoCtaHref: string | null
  promoGradient: string | null
  promoImageUrl: string | null
  promoSecondHeadingAr: string | null
  promoSecondBodyAr: string | null
  promoSecondCtaLabelAr: string | null
  promoSecondCtaHref: string | null
  promoSecondGradient: string | null
  promoSecondImageUrl: string | null
  footerBlurbAr: string | null
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
    subtitleAr: null,
    ctaLabelAr: '',
    ctaHref: '',
    imageUrl: null,
    bgStyle: 'BLUE',
    sortOrder: slides.value.length,
    enabled: true,
  })
  slideBanner.value = null
}

async function saveSlide(s: HeroSlideRow, index: number) {
  const payload = {
    titleAr: s.titleAr.trim(),
    subtitleAr: s.subtitleAr?.trim() || null,
    ctaLabelAr: s.ctaLabelAr.trim(),
    ctaHref: s.ctaHref.trim(),
    imageUrl: s.imageUrl?.trim() || null,
    bgStyle: s.bgStyle,
    sortOrder: Number.isFinite(s.sortOrder) ? Math.trunc(s.sortOrder) : 0,
    enabled: s.enabled,
  }
  if (!payload.titleAr || !payload.ctaLabelAr || !payload.ctaHref) {
    slideBanner.value = { type: 'err', text: 'أكمل حقول الشريحة: العنوان وزر CTA ورابطه مطلوبة.' }
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
    slideBanner.value = { type: 'ok', text: 'تم حفظ الشريحة بنجاح.' }
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
  if (!window.confirm('هل أنت متأكد من حذف هذه الشريحة الإعلانية؟')) return
  savingSlideKey.value = slideKey(s, index)
  slideBanner.value = null
  try {
    await $fetch(`/api/admin/hero-slides/${s.id}`, { method: 'DELETE' })
    slideBanner.value = { type: 'ok', text: 'تم حذف الشريحة.' }
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
  promoBodyAr: null,
  promoCtaLabelAr: null,
  promoCtaHref: null,
  promoGradient: null,
  promoImageUrl: null,
  promoSecondHeadingAr: null,
  promoSecondBodyAr: null,
  promoSecondCtaLabelAr: null,
  promoSecondCtaHref: null,
  promoSecondGradient: null,
  promoSecondImageUrl: null,
  footerBlurbAr: null,
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
    const t = v?.trim() ?? ''
    return t === '' ? null : t
  }
  try {
    await $fetch('/api/admin/settings', {
      method: 'PATCH',
      body: {
        promoHeadingAr: trimOrNull(settingsForm.promoHeadingAr),
        promoBodyAr: trimOrNull(settingsForm.promoBodyAr),
        promoCtaLabelAr: trimOrNull(settingsForm.promoCtaLabelAr),
        promoCtaHref: trimOrNull(settingsForm.promoCtaHref),
        promoGradient: trimOrNull(settingsForm.promoGradient),
        promoImageUrl: trimOrNull(settingsForm.promoImageUrl),
        promoSecondHeadingAr: trimOrNull(settingsForm.promoSecondHeadingAr),
        promoSecondBodyAr: trimOrNull(settingsForm.promoSecondBodyAr),
        promoSecondCtaLabelAr: trimOrNull(settingsForm.promoSecondCtaLabelAr),
        promoSecondCtaHref: trimOrNull(settingsForm.promoSecondCtaHref),
        promoSecondGradient: trimOrNull(settingsForm.promoSecondGradient),
        promoSecondImageUrl: trimOrNull(settingsForm.promoSecondImageUrl),
        footerBlurbAr: trimOrNull(settingsForm.footerBlurbAr),
      },
    })
    settingsBanner.value = { type: 'ok', text: 'تم حفظ إعدادات المحتوى بنجاح.' }
  } catch (e) {
    settingsBanner.value = { type: 'err', text: adminFetchMessage(e) }
  } finally {
    savingSettings.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-extrabold text-navy">المحتوى</h1>

    <section class="rounded-xl border border-line bg-white p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-bold text-navy">الشراائح الإعلانية (الواجهة الرئيسية)</h2>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
          @click="addSlide"
        >
          <Plus class="h-4 w-4" :aria-hidden="true" />
          <span>إضافة شريحة</span>
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

      <div v-if="heroPending" class="py-6 text-center text-sm text-mutedtext">جارٍ تحميل الشراائح...</div>
      <div v-else-if="heroError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ adminFetchMessage(heroError) }}
      </div>

      <div v-else class="space-y-4">
        <p v-if="slides.length === 0" class="text-sm text-mutedtext">لا توجد شراائح — أضف شريحة جديدة.</p>

        <div v-for="(s, i) in slides" :key="slideKey(s, i)" class="rounded-lg border border-line p-4">
          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-title-${i}`">العنوان</label>
              <input :id="`hero-title-${i}`" v-model="s.titleAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-sub-${i}`">العنوان الفرعي</label>
              <input :id="`hero-sub-${i}`" v-model="s.subtitleAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-cta-${i}`">نص الزر</label>
              <input :id="`hero-cta-${i}`" v-model="s.ctaLabelAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-href-${i}`">رابط الزر</label>
              <input :id="`hero-href-${i}`" v-model="s.ctaHref" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-img-${i}`">رابط الصورة</label>
              <input :id="`hero-img-${i}`" v-model="s.imageUrl" type="url" dir="ltr" :class="inputClass" >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-bg-${i}`">الخلفية</label>
                <select :id="`hero-bg-${i}`" v-model="s.bgStyle" :class="inputClass">
                  <option value="BLUE">أزرق</option>
                  <option value="AMBER">كهرماني</option>
                  <option value="INK">داكن</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-mutedtext" :for="`hero-order-${i}`">الترتيب</label>
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
              <span>مفعّلة</span>
            </label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
                :disabled="savingSlideKey === slideKey(s, i)"
                @click="saveSlide(s, i)"
              >
                <Save class="h-4 w-4" :aria-hidden="true" />
                <span>{{ savingSlideKey === slideKey(s, i) ? 'جارٍ الحفظ...' : 'حفظ' }}</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                :disabled="savingSlideKey === slideKey(s, i)"
                @click="deleteSlide(s, i)"
              >
                <Trash class="h-4 w-4" :aria-hidden="true" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-line bg-white p-5">
      <h2 class="mb-4 text-base font-bold text-navy">إعدادات المحتوى (البانرات والتذييل)</h2>

      <div
        v-if="settingsBanner"
        class="mb-4 rounded-lg px-4 py-3 text-sm"
        :class="settingsBanner.type === 'ok' ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-red-200 bg-red-50 text-red-700'"
        role="status"
      >
        {{ settingsBanner.text }}
      </div>

      <div v-if="settingsPending" class="py-6 text-center text-sm text-mutedtext">جارٍ تحميل الإعدادات...</div>
      <div v-else-if="settingsError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
        {{ adminFetchMessage(settingsError) }}
      </div>

      <div v-else class="space-y-6">
        <div>
          <h3 class="mb-3 text-sm font-bold text-navy">البانر الترويجي الأول</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p1-title" class="mb-1 block text-xs font-semibold text-mutedtext">العنوان</label>
              <input id="set-p1-title" v-model="settingsForm.promoHeadingAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-body" class="mb-1 block text-xs font-semibold text-mutedtext">النص</label>
              <input id="set-p1-body" v-model="settingsForm.promoBodyAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-cta" class="mb-1 block text-xs font-semibold text-mutedtext">نص الزر</label>
              <input id="set-p1-cta" v-model="settingsForm.promoCtaLabelAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-href" class="mb-1 block text-xs font-semibold text-mutedtext">رابط الزر</label>
              <input id="set-p1-href" v-model="settingsForm.promoCtaHref" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p1-gradient" class="mb-1 block text-xs font-semibold text-mutedtext">التدريج</label>
              <select id="set-p1-gradient" v-model="settingsForm.promoGradient" :class="inputClass">
                <option value="navy">كحلي</option>
                <option value="amber">كهرماني</option>
              </select>
            </div>
            <div>
              <label for="set-p1-img" class="mb-1 block text-xs font-semibold text-mutedtext">رابط الصورة</label>
              <input id="set-p1-img" v-model="settingsForm.promoImageUrl" type="url" dir="ltr" :class="inputClass" >
            </div>
          </div>
        </div>

        <div>
          <h3 class="mb-3 text-sm font-bold text-navy">البانر الترويجي الثاني</h3>
          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label for="set-p2-title" class="mb-1 block text-xs font-semibold text-mutedtext">العنوان</label>
              <input id="set-p2-title" v-model="settingsForm.promoSecondHeadingAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-body" class="mb-1 block text-xs font-semibold text-mutedtext">النص</label>
              <input id="set-p2-body" v-model="settingsForm.promoSecondBodyAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-cta" class="mb-1 block text-xs font-semibold text-mutedtext">نص الزر</label>
              <input id="set-p2-cta" v-model="settingsForm.promoSecondCtaLabelAr" type="text" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-href" class="mb-1 block text-xs font-semibold text-mutedtext">رابط الزر</label>
              <input id="set-p2-href" v-model="settingsForm.promoSecondCtaHref" type="text" dir="ltr" :class="inputClass" >
            </div>
            <div>
              <label for="set-p2-gradient" class="mb-1 block text-xs font-semibold text-mutedtext">التدريج</label>
              <select id="set-p2-gradient" v-model="settingsForm.promoSecondGradient" :class="inputClass">
                <option value="navy">كحلي</option>
                <option value="amber">كهرماني</option>
              </select>
            </div>
            <div>
              <label for="set-p2-img" class="mb-1 block text-xs font-semibold text-mutedtext">رابط الصورة</label>
              <input id="set-p2-img" v-model="settingsForm.promoSecondImageUrl" type="url" dir="ltr" :class="inputClass" >
            </div>
          </div>
        </div>

        <div>
          <label for="set-footer" class="mb-1 block text-xs font-semibold text-mutedtext">نص التذييل</label>
          <textarea id="set-footer" v-model="settingsForm.footerBlurbAr" rows="3" :class="inputClass" />
        </div>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
          :disabled="savingSettings"
          @click="saveSettings"
        >
          <Save class="h-4 w-4" :aria-hidden="true" />
          <span>{{ savingSettings ? 'جارٍ الحفظ...' : 'حفظ الإعدادات' }}</span>
        </button>
      </div>
    </section>
  </div>
</template>
