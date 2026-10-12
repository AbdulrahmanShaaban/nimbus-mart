<script setup lang="ts">
import { MessageCircle, Camera, Send, AtSign, Phone, Mail, MapPin, CreditCard, Truck, ShieldCheck } from '@lucide/vue'
import type { FooterContentDto } from '~/types/api'

const { data: footerData } = await useAsyncData(
  'site-footer',
  () => $fetch<FooterContentDto>('/api/content/footer'),
)

const blurbAr = computed(
  () => footerData.value?.blurbAr ?? 'نِمبوس مارت — متجرك الإلكتروني الموثوق بأسعار منافسة وتوصيل سريع لكل محافظات مصر.',
)

const footerCategories = computed(() => footerData.value?.categories ?? [])
</script>

<template>
  <footer class="bg-surface text-navy">
    <div class="mx-auto max-w-[1330px] px-4 py-12 md:px-6 md:py-16">
      <div class="mb-10 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <NuxtLink to="/" class="mb-4 flex items-center gap-1.5 text-xl font-black text-navy focus-visible:outline-2 focus-visible:outline-brand">
            <span class="h-2.5 w-2.5 rounded-full bg-neon" aria-hidden="true" />
            نِمبوس مارت
          </NuxtLink>
          <p class="text-sm leading-relaxed text-bodytext">{{ blurbAr }}</p>
          <ul class="mt-5 flex gap-3">
            <li>
              <a href="#" aria-label="واتساب" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <MessageCircle :size="17" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href="#" aria-label="إنستجرام" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <Camera :size="17" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href="#" aria-label="تيليجرام" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <Send :size="17" aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href="#" aria-label="إكس" class="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-brand">
                <AtSign :size="17" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-4 text-base font-extrabold text-navy">روابط سريعة</h2>
          <ul class="flex flex-col gap-2.5 text-sm text-bodytext">
            <li><NuxtLink to="/products" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">كل المنتجات</NuxtLink></li>
            <li><NuxtLink to="/cart" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">سلة التسوق</NuxtLink></li>
            <li><NuxtLink to="/wishlist" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">المفضلة</NuxtLink></li>
            <li><NuxtLink to="/account/orders" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">تتبع طلباتك</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h2 class="mb-4 text-base font-extrabold text-navy">التصنيفات</h2>
          <ul class="flex flex-col gap-2.5 text-sm text-bodytext">
            <li v-for="category in footerCategories" :key="category.slug">
              <NuxtLink
                :to="`/categories/${category.slug}`"
                class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                {{ category.nameAr }}
              </NuxtLink>
            </li>
            <li v-if="footerCategories.length === 0">
              <NuxtLink to="/products" class="text-bodytext transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">
                تصفح التصنيفات
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="mb-4 text-base font-extrabold text-navy">تواصل معنا</h2>
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
              القاهرة، مصر
            </li>
          </ul>
        </div>
      </div>

      <ul class="mb-10 grid gap-4 rounded-2xl border border-line bg-white p-6 sm:grid-cols-3">
        <li class="flex items-center gap-3 text-sm font-semibold text-bodytext">
          <CreditCard :size="20" class="shrink-0 text-navy" aria-hidden="true" />
          دفع آمن (بطاقات ومحافظ إلكترونية)
        </li>
        <li class="flex items-center gap-3 text-sm font-semibold text-bodytext">
          <Truck :size="20" class="shrink-0 text-navy" aria-hidden="true" />
          توصيل لكل محافظات مصر
        </li>
        <li class="flex items-center gap-3 text-sm font-semibold text-bodytext">
          <ShieldCheck :size="20" class="shrink-0 text-navy" aria-hidden="true" />
          ضمان استرجاع حسب الشروط
        </li>
      </ul>

      <div class="border-t border-line pt-6 text-center text-xs text-mutedtext">
        © {{ new Date().getFullYear() }} نِمبوس مارت — جميع الحقوق محفوظة
      </div>
    </div>
  </footer>
</template>
