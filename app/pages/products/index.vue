<script setup lang="ts">
useHead({ title: 'كل المنتجات — نِمبوس مارت' })
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs :items="[{ label: 'الرئيسية', href: '/' }, { label: 'كل المنتجات' }]" />
    <ProductBrowser heading="كل المنتجات" />
  </div>
</template>
