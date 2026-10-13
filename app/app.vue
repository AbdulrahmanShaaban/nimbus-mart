<script setup lang="ts">
import { useLocaleHead } from '#imports'

const i18nHead = useLocaleHead({ dir: true, lang: true, seo: true })
useHead(() => i18nHead.value)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
