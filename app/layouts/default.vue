<script setup lang="ts">
import { MessageCircle } from '@lucide/vue'
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
      class="fixed bottom-6 end-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(7,60,226,0.35)] transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      aria-label="تواصل معنا عبر البريد"
    >
      <MessageCircle :size="24" aria-hidden="true" />
    </a>
  </div>
</template>
