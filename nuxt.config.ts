import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-11',
  devtools: { enabled: false },
  ssr: true,
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css', 'swiper/css', 'swiper/css/navigation', 'swiper/css/pagination'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      title: 'Nimbus Mart — تسوّقٌ خفيف كالسحاب',
      meta: [
        { name: 'description', content: 'نِمبوس مارت — متجر إلكتروني مصري للعناية بالمنزل والمطبخ والأجهزة، توصيل سريع والدفع عند الاستلام.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800;900&display=swap',
        },
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
