<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))

useHead({
  title: computed(() => (q.value ? `${t('search.resultsTitle', { q: q.value })} — ${t('header.brand')}` : `${t('search.title')} — ${t('header.brand')}`)),
})
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs :items="[{ label: t('nav.home'), href: '/' }, { label: t('search.title') }]" />
    <ProductBrowser :heading="q ? t('search.resultsTitle', { q }) : t('search.resultsHeading')" />
  </div>
</template>
