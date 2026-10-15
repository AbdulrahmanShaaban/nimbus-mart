<script setup lang="ts">
import { X, ChevronLeft, ChevronRight } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  images: string[]
  title: string
  modelValue: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const { t, locale } = useI18n()

const imageCount = computed(() => props.images.length)

const selectedIndex = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const clampedIndex = computed(() => {
  if (imageCount.value === 0) return 0
  return Math.min(Math.max(0, selectedIndex.value), imageCount.value - 1)
})

const currentImage = computed(() => props.images[clampedIndex.value] ?? '')

const PrevIcon = computed(() => (locale.value === 'en' ? ChevronLeft : ChevronRight))
const NextIcon = computed(() => (locale.value === 'en' ? ChevronRight : ChevronLeft))

const lightboxOpen = ref(false)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
let savedOverflow = ''

function selectImage(index: number) {
  selectedIndex.value = index
}

function step(delta: number) {
  if (imageCount.value === 0) return
  selectedIndex.value = (clampedIndex.value + delta + imageCount.value) % imageCount.value
}

function openLightbox() {
  if (imageCount.value === 0) return
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeLightbox()
  else if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
}

watch(lightboxOpen, async (open) => {
  if (!import.meta.client) return
  if (open) {
    savedOverflow = document.body.style.overflow
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    document.body.style.overflow = 'hidden'
    closeButtonRef.value?.focus()
  } else {
    document.body.style.overflow = savedOverflow
    window.removeEventListener('keydown', onKeydown)
    triggerRef.value?.focus()
  }
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.removeEventListener('keydown', onKeydown)
  if (lightboxOpen.value) document.body.style.overflow = savedOverflow
})
</script>

<template>
  <div>
    <button
      ref="triggerRef"
      type="button"
      class="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-[#FAFAFA] focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default"
      :disabled="imageCount === 0"
      :aria-label="t('product.openImage', { title, index: clampedIndex + 1 })"
      @click="openLightbox"
    >
      <Transition name="nm-pdp-fade" mode="out-in">
        <img
          v-if="currentImage"
          :key="currentImage"
          :src="currentImage"
          :alt="title"
          class="h-full w-full object-contain p-3 md:p-8"
        >
      </Transition>
      <span
        v-if="imageCount > 0"
        class="pointer-events-none absolute bottom-3 end-3 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-bold text-white"
      >
        <bdi dir="ltr">{{ clampedIndex + 1 }} / {{ imageCount }}</bdi>
      </span>
    </button>

    <div v-if="imageCount > 1" class="mt-3 flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="(image, index) in images"
        :key="image"
        type="button"
        class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors focus-visible:outline-2 focus-visible:outline-brand"
        :class="index === clampedIndex ? 'border-brand' : 'border-line'"
        :aria-label="t('product.imageLabel', { index: index + 1 })"
        @click="selectImage(index)"
      >
        <img :src="image" :alt="t('product.imageAlt', { title, index: index + 1 })" loading="lazy" class="h-full w-full object-cover">
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="t('product.lightbox')"
        @click.self="closeLightbox"
      >
        <img
          v-if="currentImage"
          :src="currentImage"
          :alt="t('product.imageAlt', { title, index: clampedIndex + 1 })"
          class="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
        >
        <button
          ref="closeButtonRef"
          type="button"
          class="absolute end-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          :aria-label="t('product.lightboxClose')"
          @click="closeLightbox"
        >
          <X :size="20" aria-hidden="true" />
        </button>
        <button
          v-if="imageCount > 1"
          type="button"
          class="absolute start-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          :aria-label="t('common.prev')"
          @click="step(-1)"
        >
          <component :is="PrevIcon" :size="20" aria-hidden="true" />
        </button>
        <button
          v-if="imageCount > 1"
          type="button"
          class="absolute end-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          :aria-label="t('common.next')"
          @click="step(1)"
        >
          <component :is="NextIcon" :size="20" aria-hidden="true" />
        </button>
        <p class="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm font-bold text-white">
          <bdi dir="ltr">{{ clampedIndex + 1 }} / {{ imageCount }}</bdi>
        </p>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.nm-pdp-fade-enter-active,
.nm-pdp-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.nm-pdp-fade-enter-from,
.nm-pdp-fade-leave-to {
  opacity: 0;
}
</style>
