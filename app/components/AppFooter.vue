<script setup lang="ts">
import { Phone, Mail, MapPin } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { FooterContentDto } from '~/types/api'

const { t } = useI18n()
const { pick } = useLocalized()

const { data: footerData } = await useAsyncData(
  'site-footer',
  () => $fetch<FooterContentDto>('/api/content/footer'),
)

const blurb = computed(() => pick(footerData.value?.blurbAr, footerData.value?.blurbEn) || t('footer.blurb'))

const footerCategories = computed(() => footerData.value?.categories ?? [])
</script>

<template>
  <footer class="bg-surface text-navy">
    <div class="mx-auto max-w-[1330px] px-4 py-10 md:px-6 md:py-16">
      <div class="mb-8 grid gap-8 md:mb-10 md:grid-cols-2 md:gap-10 lg:grid-cols-4">
        <div>
          <NuxtLink to="/" class="mb-4 flex items-center gap-1.5 text-xl font-black text-navy focus-visible:outline-2 focus-visible:outline-brand">
            <span class="h-2.5 w-2.5 rounded-full bg-neon" aria-hidden="true" />
            {{ t('footer.brand') }}
          </NuxtLink>
          <p class="text-sm leading-relaxed text-bodytext">{{ blurb }}</p>
        </div>

        <div>
          <h2 class="mb-4 text-base font-extrabold text-navy">{{ t('footer.quickLinks') }}</h2>
          <ul class="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-bodytext md:flex md:flex-col">
            <li><NuxtLink to="/products" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{{ t('footer.allProducts') }}</NuxtLink></li>
            <li><NuxtLink to="/cart" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{{ t('footer.cart') }}</NuxtLink></li>
            <li><NuxtLink to="/wishlist" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{{ t('footer.wishlist') }}</NuxtLink></li>
            <li><NuxtLink to="/account/orders" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">{{ t('footer.trackOrders') }}</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h2 class="mb-4 text-base font-extrabold text-navy">{{ t('footer.categories') }}</h2>
          <ul class="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-bodytext md:flex md:flex-col">
            <li v-for="category in footerCategories" :key="category.slug">
              <NuxtLink
                :to="`/categories/${category.slug}`"
                class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                {{ pick(category.nameAr, category.nameEn) }}
              </NuxtLink>
            </li>
            <li v-if="footerCategories.length === 0">
              <NuxtLink to="/products" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">
                {{ t('footer.browseCategories') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-4 text-base font-extrabold text-navy">{{ t('footer.contact') }}</h2>
          <ul class="flex flex-col gap-3 text-sm text-bodytext">
            <li class="flex items-center gap-2.5">
              <Phone :size="16" class="shrink-0 text-brand" aria-hidden="true" />
              <span dir="ltr">0100 000 0000</span>
            </li>
            <li class="flex items-center gap-2.5">
              <Mail :size="16" class="shrink-0 text-brand" aria-hidden="true" />
              <a href="mailto:support@nimbusmart.eg" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand" dir="ltr">support@nimbusmart.eg</a>
            </li>
            <li class="flex items-center gap-2.5">
              <MapPin :size="16" class="shrink-0 text-brand" aria-hidden="true" />
              {{ t('footer.location') }}
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-line pt-6 text-center text-xs text-mutedtext">
        © {{ new Date().getFullYear() }} {{ t('footer.brand') }} — {{ t('footer.rights') }}
      </div>
    </div>
  </footer>
</template>
