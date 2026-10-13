<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <a
      href="mailto:support@nimbusmart.eg"
      class="fixed bottom-4 end-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(7,60,226,0.35)] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 md:bottom-6 md:end-6 md:h-14 md:w-14"
      :aria-label="t('footer.contactEmailAria')"
    >
      <MessageCircle :size="24" aria-hidden="true" />
    </a>
  </div>
</template>
