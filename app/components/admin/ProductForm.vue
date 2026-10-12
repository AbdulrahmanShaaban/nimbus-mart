<script setup lang="ts">
import { Plus, Trash, Save } from '@lucide/vue'
import type {
  AdminProductInitial,
  AdminProductFormValue,
} from '~/types/admin-product-form'

const props = defineProps<{
  initial?: AdminProductInitial | null
  saving?: boolean
  serverError?: string | null
}>()

const emit = defineEmits<{
  submit: [payload: AdminProductFormValue]
}>()

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy focus-visible:outline-2 focus-visible:outline-brand'

interface VariantRow {
  id?: string
  sku: string
  size: string
  color: string
  colorHex: string
  priceEgp: string
  stock: number
  imageUrl: string
}

function centsToEgp(cents: string): string {
  try {
    const n = Number(BigInt(cents))
    return (n / 100).toFixed(2)
  } catch {
    return ''
  }
}

function egpToCents(v: string): string {
  const f = Number.parseFloat(v)
  if (!Number.isFinite(f) || f < 0) return ''
  return String(Math.round(f * 100))
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

const init = props.initial ?? null

const titleAr = ref(init?.titleAr ?? '')
const titleEn = ref(init?.titleEn ?? '')
const slug = ref(init?.slug ?? '')
const categoryId = ref(init?.categoryId ?? '')
const descriptionAr = ref(init?.descriptionAr ?? '')
const priceEgp = ref(init ? centsToEgp(init.priceCents) : '')
const compareAtEgp = ref(init?.compareAtCents ? centsToEgp(init.compareAtCents) : '')
const status = ref<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>(
  init?.status === 'DRAFT' || init?.status === 'ARCHIVED' ? init.status : 'ACTIVE',
)
const images = ref<string[]>([...(init?.images ?? [])])
const variants = ref<VariantRow[]>(
  (init?.variants ?? []).map((v) => ({
    id: v.id,
    sku: v.sku,
    size: v.size ?? '',
    color: v.color ?? '',
    colorHex: v.colorHex ?? '',
    priceEgp: v.priceCents != null ? centsToEgp(v.priceCents) : '',
    stock: v.stock,
    imageUrl: v.imageUrl ?? '',
  })),
)

const errors = ref<Record<string, string>>({})

interface CategoryOption {
  id: string
  nameAr: string
}
const categories = ref<CategoryOption[]>([])
const categoriesError = ref<string | null>(null)

async function loadCategories() {
  try {
    const res = await $fetch<unknown>('/api/categories')
    const arr = Array.isArray(res)
      ? res
      : ((res as { items?: unknown[] } | null)?.items ??
        (res as { categories?: unknown[] } | null)?.categories ??
        [])
    const out: CategoryOption[] = []
    for (const raw of arr) {
      if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>
        if (typeof r.id === 'string') {
          const name =
            typeof r.nameAr === 'string'
              ? r.nameAr
              : typeof r.name === 'string'
                ? r.name
                : r.id
          out.push({ id: r.id, nameAr: name })
        }
      }
    }
    categories.value = out
    if (!init && !categoryId.value) {
      const first = out[0]
      if (first) categoryId.value = first.id
    }
  } catch {
    categoriesError.value = 'تعذّر تحميل التصنيفات — تحقق من الاتصال ثم أعد تحميل الصفحة'
  }
}

onMounted(() => {
  void loadCategories()
})

function addImage() {
  images.value.push('')
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function addVariant() {
  variants.value.push({
    sku: '',
    size: '',
    color: '',
    colorHex: '',
    priceEgp: '',
    stock: 0,
    imageUrl: '',
  })
}

function removeVariant(index: number) {
  if (variants.value.length <= 1) return
  variants.value.splice(index, 1)
}

function validate(): boolean {
  const e: Record<string, string> = {}

  if (titleAr.value.trim().length < 2) {
    e.titleAr = 'أدخل عنوانًا عربيًا (حرفان على الأقل)'
  }

  const slugVal = slug.value.trim()
  if (!/^[a-z0-9-]+$/.test(slugVal) || slugVal.length < 2) {
    e.slug = 'أدخل رابطًا صالحًا بأحرف إنجليزية صغيرة وأرقام وشرطات فقط'
  }

  if (!categoryId.value) {
    e.categoryId = 'اختر التصنيف'
  }

  if (descriptionAr.value.trim().length < 2) {
    e.descriptionAr = 'أدخل وصفًا (حرفان على الأقل)'
  }

  if (!egpToCents(priceEgp.value)) {
    e.priceEgp = 'أدخل سعرًا صحيحًا بالجنيه المصري'
  }

  if (compareAtEgp.value.trim() && !egpToCents(compareAtEgp.value)) {
    e.compareAtEgp = 'أدخل سعرًا صحيحًا أو اترك الحقل فارغًا'
  }

  const trimmedImages = images.value.map((s) => s.trim()).filter((s) => s.length > 0)
  for (const img of trimmedImages) {
    if (!isHttpUrl(img)) {
      e.images = 'تأكد أن كل روابط الصور تبدأ بـ http أو https'
      break
    }
  }

  if (variants.value.length < 1) {
    e.variants = 'أضف متغيرًا واحدًا على الأقل'
  }

  variants.value.forEach((v, i) => {
    if (!v.sku.trim()) {
      e[`variant-${i}`] = 'أدخل رمز SKU لكل متغير'
    }
  })

  errors.value = e
  return Object.keys(e).length === 0
}

function fieldError(key: string): string | null {
  return errors.value[key] ?? null
}

function onSubmit() {
  if (!validate()) return
  emit('submit', {
    titleAr: titleAr.value.trim(),
    titleEn: titleEn.value.trim(),
    slug: slug.value.trim(),
    categoryId: categoryId.value,
    descriptionAr: descriptionAr.value.trim(),
    priceCents: egpToCents(priceEgp.value),
    compareAtCents: compareAtEgp.value.trim() ? egpToCents(compareAtEgp.value) : null,
    status: status.value,
    images: images.value.map((s) => s.trim()).filter((s) => s.length > 0),
    variants: variants.value.map((v) => ({
      id: v.id,
      sku: v.sku.trim(),
      size: v.size.trim() || null,
      color: v.color.trim() || null,
      colorHex: v.colorHex.trim() || null,
      priceCents: v.priceEgp.trim() ? egpToCents(v.priceEgp) : null,
      stock: Number.isFinite(v.stock) ? Math.max(0, Math.trunc(v.stock)) : 0,
      imageUrl: v.imageUrl.trim() || null,
    })),
  })
}
</script>

<template>
  <form class="space-y-6" novalidate @submit.prevent="onSubmit">
    <div
      v-if="serverError"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {{ serverError }}
    </div>

    <section class="rounded-xl border border-line bg-white p-5">
      <h2 class="mb-4 text-base font-bold text-navy">معلومات المنتج</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="pf-title-ar" class="mb-1 block text-sm font-semibold text-navy">العنوان (عربي)</label>
          <input id="pf-title-ar" v-model="titleAr" type="text" :class="inputClass" required >
          <p v-if="fieldError('titleAr')" class="mt-1 text-xs text-red-600">{{ fieldError('titleAr') }}</p>
        </div>
        <div>
          <label for="pf-title-en" class="mb-1 block text-sm font-semibold text-navy">
            العنوان (إنجليزي) <span class="font-normal text-mutedtext">— اختياري</span>
          </label>
          <input id="pf-title-en" v-model="titleEn" type="text" dir="ltr" :class="inputClass" >
        </div>
        <div>
          <label for="pf-slug" class="mb-1 block text-sm font-semibold text-navy">الرابط (Slug)</label>
          <input id="pf-slug" v-model="slug" type="text" dir="ltr" :class="inputClass" required >
          <p class="mt-1 text-xs text-mutedtext">يُستخدم في الرابط: /products/...</p>
          <p v-if="fieldError('slug')" class="mt-1 text-xs text-red-600">{{ fieldError('slug') }}</p>
        </div>
        <div>
          <label for="pf-category" class="mb-1 block text-sm font-semibold text-navy">التصنيف</label>
          <select id="pf-category" v-model="categoryId" :class="inputClass" required>
            <option value="" disabled>اختر التصنيف</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nameAr }}</option>
          </select>
          <p v-if="categoriesError" class="mt-1 text-xs text-red-600">{{ categoriesError }}</p>
          <p v-else-if="fieldError('categoryId')" class="mt-1 text-xs text-red-600">{{ fieldError('categoryId') }}</p>
        </div>
        <div class="md:col-span-2">
          <label for="pf-desc" class="mb-1 block text-sm font-semibold text-navy">الوصف</label>
          <textarea id="pf-desc" v-model="descriptionAr" rows="5" :class="inputClass" required />
          <p v-if="fieldError('descriptionAr')" class="mt-1 text-xs text-red-600">{{ fieldError('descriptionAr') }}</p>
        </div>
        <div>
          <label for="pf-price" class="mb-1 block text-sm font-semibold text-navy">السعر (ج.م)</label>
          <input
            id="pf-price"
            v-model="priceEgp"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            dir="ltr"
            :class="inputClass"
            required
          >
          <p v-if="fieldError('priceEgp')" class="mt-1 text-xs text-red-600">{{ fieldError('priceEgp') }}</p>
        </div>
        <div>
          <label for="pf-compare" class="mb-1 block text-sm font-semibold text-navy">
            سعر قبل الخصم (ج.م) <span class="font-normal text-mutedtext">— اختياري</span>
          </label>
          <input
            id="pf-compare"
            v-model="compareAtEgp"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            dir="ltr"
            :class="inputClass"
          >
          <p v-if="fieldError('compareAtEgp')" class="mt-1 text-xs text-red-600">{{ fieldError('compareAtEgp') }}</p>
        </div>
        <div>
          <label for="pf-status" class="mb-1 block text-sm font-semibold text-navy">الحالة</label>
          <select id="pf-status" v-model="status" :class="inputClass">
            <option value="ACTIVE">نشط</option>
            <option value="DRAFT">مسودة</option>
            <option value="ARCHIVED">مؤرشف</option>
          </select>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-line bg-white p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-bold text-navy">الصور</h2>
        <button
          type="button"
          class="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
          @click="addImage"
        >
          <Plus class="h-4 w-4" :aria-hidden="true" />
          <span>إضافة صورة</span>
        </button>
      </div>
      <p v-if="images.length === 0" class="text-sm text-mutedtext">
        لا توجد صور بعد — أضف رابط صورة (DummyJSON أو غيره).
      </p>
      <div class="space-y-2">
        <div v-for="(img, i) in images" :key="i" class="flex items-center gap-2">
          <input
            v-model="images[i]"
            type="url"
            dir="ltr"
            placeholder="https://cdn.dummyjson.com/..."
            :class="inputClass"
            :aria-label="`رابط الصورة ${i + 1}`"
          >
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
            :aria-label="`حذف الصورة ${i + 1}`"
            @click="removeImage(i)"
          >
            <Trash class="h-4 w-4" :aria-hidden="true" />
          </button>
        </div>
      </div>
      <p v-if="fieldError('images')" class="mt-2 text-xs text-red-600">{{ fieldError('images') }}</p>
    </section>

    <section class="rounded-xl border border-line bg-white p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-bold text-navy">المتغيرات</h2>
        <button
          type="button"
          class="flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy transition-colors hover:bg-surface/60"
          @click="addVariant"
        >
          <Plus class="h-4 w-4" :aria-hidden="true" />
          <span>إضافة متغير</span>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface/50 text-start">
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">SKU</th>
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">المقاس</th>
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">اللون</th>
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">كود اللون</th>
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">السعر البديل (ج.م)</th>
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">المخزون</th>
              <th class="px-3 py-2 text-start text-xs font-semibold text-mutedtext">صورة المتغير</th>
              <th class="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, i) in variants" :key="v.id ?? i" class="border-t border-line align-middle">
              <td class="px-3 py-2">
                <input
                  v-model="v.sku"
                  type="text"
                  dir="ltr"
                  class="w-28 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="رمز SKU"
                >
                <p v-if="fieldError(`variant-${i}`)" class="mt-1 text-xs text-red-600">{{ fieldError(`variant-${i}`) }}</p>
              </td>
              <td class="px-3 py-2">
                <input
                  v-model="v.size"
                  type="text"
                  class="w-20 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="المقاس"
                >
              </td>
              <td class="px-3 py-2">
                <input
                  v-model="v.color"
                  type="text"
                  class="w-24 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="اسم اللون"
                >
              </td>
              <td class="px-3 py-2">
                <div class="flex items-center gap-1">
                  <input
                    type="color"
                    :value="v.colorHex || '#cccccc'"
                    class="h-8 w-8 shrink-0 cursor-pointer rounded border border-line bg-white p-0.5"
                    aria-label="منتقي كود اللون"
                    @input="v.colorHex = ($event.target as HTMLInputElement).value"
                  >
                  <input
                    v-model="v.colorHex"
                    type="text"
                    dir="ltr"
                    placeholder="#073ce2"
                    class="w-24 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                    aria-label="كود اللون"
                  >
                </div>
              </td>
              <td class="px-3 py-2">
                <input
                  v-model="v.priceEgp"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  class="w-28 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="السعر البديل"
                >
              </td>
              <td class="px-3 py-2">
                <input
                  v-model.number="v.stock"
                  type="number"
                  min="0"
                  max="9999"
                  step="1"
                  dir="ltr"
                  class="w-20 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="المخزون"
                >
              </td>
              <td class="px-3 py-2">
                <input
                  v-model="v.imageUrl"
                  type="url"
                  dir="ltr"
                  placeholder="https://..."
                  class="w-40 rounded-lg border border-line px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-brand"
                  aria-label="صورة المتغير"
                >
              </td>
              <td class="px-3 py-2">
                <button
                  type="button"
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="variants.length <= 1"
                  :aria-label="`حذف المتغير ${i + 1}`"
                  @click="removeVariant(i)"
                >
                  <Trash class="h-4 w-4" :aria-hidden="true" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="fieldError('variants')" class="mt-2 text-xs text-red-600">{{ fieldError('variants') }}</p>
    </section>

    <div class="flex items-center gap-3">
      <button
        type="submit"
        class="flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
        :disabled="saving === true"
      >
        <Save class="h-4 w-4" :aria-hidden="true" />
        <span>{{ saving === true ? 'جارٍ الحفظ...' : 'حفظ المنتج' }}</span>
      </button>
    </div>
  </form>
</template>
