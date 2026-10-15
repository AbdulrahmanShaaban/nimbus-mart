import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-11',
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxt/eslint', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css', 'swiper/css', 'swiper/css/navigation', 'swiper/css/pagination'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
  },
  i18n: {
    locales: [
      {
        code: 'ar',
        language: 'ar-EG',
        files: ['ar.json', 'ar.storefront-components.json', 'ar.storefront-pages.json', 'ar.admin.json'],
        name: 'العربية',
        dir: 'rtl',
      },
      {
        code: 'en',
        language: 'en-US',
        files: ['en.json', 'en.storefront-components.json', 'en.storefront-pages.json', 'en.admin.json'],
        name: 'English',
        dir: 'ltr',
      },
    ],
    defaultLocale: 'ar',
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://nimbus-mart.vercel.app',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'nm_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
  },
  app: {
    head: {
      title: 'Nimbus Mart — تسوّقٌ خفيف كالسحاب',
      meta: [
        { name: 'description', content: 'نِمبوس مارت — متجر إلكتروني مصري للعناية بالمنزل والمطبخ والأجهزة، توصيل سريع والدفع عند الاستلام.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://cdn.dummyjson.com' },
        { rel: 'stylesheet', href: '/fonts/alexandria.css' },
      ],
    },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'nimbus-dev-secret',
  },
  nitro: {
    compatibilityDate: '2026-10-11',
  },
})
