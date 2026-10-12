<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
  }>(),
  { title: 'عروض تنتهي قريباً', subtitle: 'لفترة محدودة — الحق قبل النفاذ' },
)

const UNITS = [
  { key: 'd', label: 'أيام' },
  { key: 'h', label: 'ساعات' },
  { key: 'm', label: 'دقائق' },
  { key: 's', label: 'ثواني' },
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
  parts.d = String(Math.floor(totalSeconds / 86400)).padStart(3, '0')
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
        <h2 class="text-2xl font-black text-neon md:text-[28px]">{{ title }}</h2>
        <p class="mt-1 text-sm text-white/80">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-2.5" role="timer" aria-label="الوقت المتبقي للعرض">
        <template v-for="(unit, index) in UNITS" :key="unit.key">
          <span v-if="index > 0" class="text-xl font-black text-white/40" aria-hidden="true">:</span>
          <div class="flex flex-col items-center">
            <span
              class="grid h-14 w-14 place-items-center rounded-full bg-[#071C55] text-base font-black text-white ring-1 ring-white/15 md:h-16 md:w-16 md:text-lg"
            >{{ parts[unit.key] }}</span>
            <span class="mt-1.5 text-center text-[11px] text-white/70">{{ unit.label }}</span>
          </div>
        </template>
      </div>
    </div>
    <slot />
  </section>
</template>
