<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  title?: string
  subtitle?: string
}>()

const { t } = useI18n()

const resolvedTitle = computed(() => props.title ?? t('cd.title'))
const resolvedSubtitle = computed(() => props.subtitle ?? t('cd.subtitle'))

const UNITS = [
  { key: 'd', labelKey: 'cd.days' },
  { key: 'h', labelKey: 'cd.hours' },
  { key: 'm', labelKey: 'cd.minutes' },
  { key: 's', labelKey: 'cd.seconds' },
] as const

type UnitKey = (typeof UNITS)[number]['key']

const parts = reactive<Record<UnitKey, string>>({ d: '000', h: '00', m: '00', s: '00' })

let intervalId: ReturnType<typeof setInterval> | null = null

function cairoWallClockMs(date: Date): number {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const [hour = '0', minute = '0', second = '0'] = formatter.format(date).split(':')
  return Number(hour) * 3600_000 + Number(minute) * 60_000 + Number(second) * 1000
}

function cairoDeadline(addDays: number): number {
  const now = new Date()
  const dayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const [year = 1970, month = 1, day = 1] = dayParts.split('-').map(Number)
  const guess = new Date(Date.UTC(year, month - 1, day + addDays, 23, 59, 59))
  const shown = cairoWallClockMs(guess)
  const wanted = 23 * 3600_000 + 59 * 60_000 + 59 * 1000
  return guess.getTime() + (wanted - shown)
}

const deadline = ref<number>(0)

function tick() {
  const remaining = Math.max(0, deadline.value - Date.now())
  const totalSeconds = Math.floor(remaining / 1000)
  parts.d = String(Math.floor(totalSeconds / 86400))
  parts.h = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0')
  parts.m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  parts.s = String(totalSeconds % 60).padStart(2, '0')
}

onMounted(() => {
  deadline.value = cairoDeadline(3)
  tick()
  intervalId = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (intervalId !== null) clearInterval(intervalId)
})
</script>

<template>
  <section class="rounded-2xl bg-navy p-6 text-white md:p-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black text-neon md:text-[28px]">{{ resolvedTitle }}</h2>
        <p class="mt-1 text-sm text-white/80">{{ resolvedSubtitle }}</p>
      </div>
      <div class="flex items-center gap-2.5 md:gap-3" role="timer" :aria-label="t('cd.timeRemaining')">
        <div
          v-for="unit in UNITS"
          :key="unit.key"
          class="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-[#071C55] ring-1 ring-white/15 md:h-[74px] md:w-[74px]"
        >
          <span class="text-lg font-black leading-none text-white md:text-xl">{{ parts[unit.key] }}</span>
          <span class="mt-1 text-[10px] leading-none text-white/70">{{ t(unit.labelKey) }}</span>
        </div>
      </div>
    </div>
    <slot />
  </section>
</template>
