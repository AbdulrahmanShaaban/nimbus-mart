<script setup lang="ts">
const route = useRoute()
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))

useHead({
  title: computed(() => (q.value ? `نتائج البحث عن «${q.value}» — نِمبوس مارت` : 'البحث — نِمبوس مارت')),
})
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <SiteBreadcrumbs :items="[{ label: 'الرئيسية', href: '/' }, { label: 'البحث' }]" />
    <ProductBrowser :heading="q ? `نتائج البحث عن «${q}»` : 'نتائج البحث'" />
  </div>
</template>
