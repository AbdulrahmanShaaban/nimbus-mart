<script setup lang="ts">
import { Star, Phone, Mail } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { ProductDetailDto } from '~/types/api'

const props = defineProps<{
  product: ProductDetailDto
  sku: string | null
}>()

const { t, locale } = useI18n()
const { pick } = useLocalized()

type TabId = 'details' | 'reviews' | 'inquiries'

const activeTab = ref<TabId>('details')

const description = computed(() => pick(props.product.descriptionAr, props.product.descriptionEn))
const isLongDescription = computed(() => description.value.length > 300)
const descriptionExpanded = ref(false)

const categoryName = computed(() => pick(props.product.category.nameAr, props.product.category.nameEn))

const addedDate = computed(() => {
  const parsed = new Date(props.product.createdAt)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { dateStyle: 'medium' })
    .format(parsed)
    .replace(/[\u200E\u200F]/g, '')
})
</script>

<template>
  <section>
    <div class="border-b border-line">
      <div class="nm-no-scrollbar flex gap-6 overflow-x-auto" role="tablist">
        <button
          id="pdp-tab-details"
          type="button"
          role="tab"
          aria-controls="pdp-panel-details"
          :aria-selected="activeTab === 'details'"
          class="-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand"
          :class="activeTab === 'details' ? 'border-brand text-brand' : 'border-transparent text-mutedtext hover:text-navy'"
          @click="activeTab = 'details'"
        >
          {{ t('product.tabDetails') }}
        </button>
        <button
          id="pdp-tab-reviews"
          type="button"
          role="tab"
          aria-controls="pdp-panel-reviews"
          :aria-selected="activeTab === 'reviews'"
          class="-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand"
          :class="activeTab === 'reviews' ? 'border-brand text-brand' : 'border-transparent text-mutedtext hover:text-navy'"
          @click="activeTab = 'reviews'"
        >
          {{ t('product.tabReviews') }}
        </button>
        <button
          id="pdp-tab-inquiries"
          type="button"
          role="tab"
          aria-controls="pdp-panel-inquiries"
          :aria-selected="activeTab === 'inquiries'"
          class="-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand"
          :class="activeTab === 'inquiries' ? 'border-brand text-brand' : 'border-transparent text-mutedtext hover:text-navy'"
          @click="activeTab = 'inquiries'"
        >
          {{ t('product.tabInquiries') }}
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'details'" id="pdp-panel-details" role="tabpanel" aria-labelledby="pdp-tab-details" class="pt-6">
      <div v-if="description" class="max-w-3xl">
        <p
          class="text-sm leading-relaxed text-bodytext"
          :class="isLongDescription && !descriptionExpanded ? 'line-clamp-3' : ''"
        >
          {{ description }}
        </p>
        <button
          v-if="isLongDescription"
          type="button"
          class="mt-2 text-sm font-bold text-brand transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-brand"
          @click="descriptionExpanded = !descriptionExpanded"
        >
          {{ descriptionExpanded ? t('product.seeLess') : t('product.seeMore') }}
        </button>
      </div>
      <dl class="mt-6 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt class="text-mutedtext">{{ t('product.metaCategory') }}</dt>
          <dd class="mt-1 font-bold text-navy">
            <NuxtLink
              :to="`/categories/${product.category.slug}`"
              class="transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              {{ categoryName }}
            </NuxtLink>
          </dd>
        </div>
        <div>
          <dt class="text-mutedtext">{{ t('product.metaSku') }}</dt>
          <dd class="mt-1 font-bold text-navy">
            <bdi dir="ltr">{{ sku ?? '—' }}</bdi>
          </dd>
        </div>
        <div>
          <dt class="text-mutedtext">{{ t('product.metaAdded') }}</dt>
          <dd class="mt-1 font-bold text-navy" dir="ltr">{{ addedDate }}</dd>
        </div>
      </dl>
    </div>

    <div v-show="activeTab === 'reviews'" id="pdp-panel-reviews" role="tabpanel" aria-labelledby="pdp-tab-reviews" class="pt-6">
      <div class="flex flex-col items-center gap-3 py-10 text-center">
        <Star :size="28" class="text-mutedtext" aria-hidden="true" />
        <p class="text-sm text-mutedtext">{{ t('product.noReviews') }}</p>
      </div>
    </div>

    <div v-show="activeTab === 'inquiries'" id="pdp-panel-inquiries" role="tabpanel" aria-labelledby="pdp-tab-inquiries" class="pt-6">
      <p class="max-w-3xl text-sm leading-relaxed text-bodytext">{{ t('product.inquireBody') }}</p>
      <div class="mt-5 flex flex-wrap gap-3">
        <a
          href="tel:0100000000"
          class="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-bold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Phone :size="17" aria-hidden="true" />
          <bdi dir="ltr">0100 000 0000</bdi>
        </a>
        <a
          href="mailto:support@nimbusmart.eg"
          class="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-bold text-brand transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Mail :size="17" aria-hidden="true" />
          <bdi dir="ltr">support@nimbusmart.eg</bdi>
        </a>
      </div>
    </div>
  </section>
</template>
