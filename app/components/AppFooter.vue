<script setup lang="ts">
import { Phone, Mail, MapPin, Truck, ShieldCheck } from '@lucide/vue'
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
          <ul class="mt-5 flex gap-3">
            <li>
              <a href="#" :aria-label="t('footer.whatsapp')" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <svg viewBox="0 0 24 24" class="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              </a>
            </li>
            <li>
              <a href="#" :aria-label="t('footer.instagram')" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <svg viewBox="0 0 24 24" class="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>
              </a>
            </li>
            <li>
              <a href="#" :aria-label="t('footer.telegram')" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <svg viewBox="0 0 24 24" class="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
            </li>
            <li>
              <a href="#" :aria-label="t('footer.x')" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <svg viewBox="0 0 24 24" class="h-[15px] w-[15px]" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              </a>
            </li>
          </ul>
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

      <ul class="mb-8 grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-3 md:mb-10 md:gap-4 md:p-6">
        <li class="flex items-center gap-3 text-sm font-semibold text-bodytext">
          <span class="flex shrink-0 items-center gap-2.5" aria-hidden="true">
            <svg viewBox="0 8 24 8" class="h-[11px] w-auto"><path fill="#1A1F71" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/></svg>
            <svg viewBox="2 1 32 22" class="h-[17px] w-auto"><circle cx="14" cy="12" r="11" fill="#EB001B"/><circle cx="22" cy="12" r="11" fill="#F79E1B"/><path fill="#FF5F00" d="M18 1.75a11 11 0 0 1 0 20.5 11 11 0 0 1 0-20.5z"/></svg>
          </span>
          {{ t('footer.securePayment') }}
        </li>
        <li class="flex items-center gap-3 text-sm font-semibold text-bodytext">
          <Truck :size="20" class="shrink-0 text-navy" aria-hidden="true" />
          {{ t('footer.nationwideDelivery') }}
        </li>
        <li class="flex items-center gap-3 text-sm font-semibold text-bodytext">
          <ShieldCheck :size="20" class="shrink-0 text-navy" aria-hidden="true" />
          {{ t('footer.returnPolicy') }}
        </li>
      </ul>

      <div class="border-t border-line pt-6 text-center text-xs text-mutedtext">
        © {{ new Date().getFullYear() }} {{ t('footer.brand') }} — {{ t('footer.rights') }}
      </div>
    </div>
  </footer>
</template>
