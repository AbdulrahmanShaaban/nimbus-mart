<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead(() => ({ title: `${t('header.allProducts')} — ${t('header.brand')}` }))
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs :items="[{ label: t('nav.home'), href: '/' }, { label: t('header.allProducts') }]" />
    <ProductBrowser :heading="t('header.allProducts')" />
  </div>
</template>
