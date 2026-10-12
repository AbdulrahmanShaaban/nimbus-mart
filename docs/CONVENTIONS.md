# CONVENTIONS — Nimbus Mart

Short rules. Project-local source of truth; global skills only where these stay silent.

## Language & typing
- **TypeScript strict** (`strict: true`, no implicit `any`, no `as` to silence types). Use TS
  `7` (native Go compiler) where the Nuxt toolchain allows; type-check with `vue-tsc --noEmit`
  (Nuxt's supported path) — must pass before any task is called done.
- Zod `4` at every API boundary (`server/api/` Nitro handlers). Never trust client payloads.
- Vue Composition API only (`<script setup lang="ts">`) per the installed `vue` skill. Use Nuxt
  auto-imports (`ref`, `computed`, `useFetch`, `useCookie`, etc.) — no manual `import` of those.

## Database (Prisma + ONE Neon Postgres)
- **snake_case columns always**, mapped from camelCase fields via Prisma `@map`
  (`priceCents` → `price_cents`). Table names `@map` to snake_case plural too.
- **Money = integer cents, `BigInt` (BIGINT) columns.** Never floats, never `Decimal` dollars.
  All arithmetic in integer/BigInt; format only at the display edge via `Intl`.
- IDs are `text` (cuid/uuid). Timestamps `timestamptz`, store UTC, render with
  `timeZone: "Africa/Cairo"`.
- Multi-step writes (checkout, admin mutations with audit) go in `prisma.$transaction`, with
  conditional guarded updates for stock.

## RTL / CSS
- `<html lang="ar" dir="rtl">` by default. Arabic-first font stack (Arabic family listed first).
- **CSS logical properties only:** `margin-inline-*`, `padding-inline-*`, `inset-inline-*`,
  `border-inline-start`, `text-align: start/end`. NEVER `left/right` for layout. Tailwind logical
  utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`).
- No `flex-direction: row-reverse` as an RTL hack. Mirror composition via `dir`, not DOM tricks.
- No `letter-spacing`, no `text-transform: uppercase`, no synthetic italic on Arabic.
- Isolate inline LTR fragments (order numbers, SKUs, emails) with `<bdi>` / `dir="ltr"`.

## Icons & components
- **Lucide only** (`@lucide/vue` in the app; CDN `lucide` in static previews). **NO emoji in any
  UI** — not in category strips, buttons, empty states, or notifications. If an icon is missing
  from Lucide, use text or a simple CSS shape, never an emoji fallback.
- UI primitives follow the preview: pill buttons for auth/CTA, rounded-full icon buttons (40px),
  product cards `rounded-2xl` with 1px border + hover lift.

## Animation
- **Light transitions only:** hover / focus-visible / press / menu open-close, **150–250ms**,
  ease-out (`cubic-bezier(0.2, 0, 0, 1)`), CSS only.
- **Product image hover zoom (documented exception, Goods&U pattern):** `.card:hover img` =
  `transform: scale(1.05)` over **500ms ease-out**; the card itself lifts `translateY(-4px)` +
  shadow over **300ms**. Both are pure CSS (`.group:hover .group-hover:scale-105` pattern or
  equivalent); still no scroll animation, no JS animation libraries.
- Hero carousel: Swiper (the only JS motion dependency), `speed: 300`, loop, autoplay 4000ms,
  pagination + navigation arrows.
- All motion guarded by `@media (prefers-reduced-motion: reduce)` — keep color changes, drop
  transforms (image zoom becomes a static image).
- **Never:** scroll animation, reveal-on-scroll, parallax, GSAP/ScrollTrigger/Lenis, framer-motion
  scroll effects. The single signature motion is the "awning sweep" in `design/direction.md`.

## Numbers & numerals (Arabic "where appropriate")
- Decide once per context, never mix digit systems inside one view:
  - **Prices, order numbers, SKUs, quantities in commerce UI: Latin digits**
    (`Intl.NumberFormat("ar-EG-u-nu-latn", …)`), e.g. `1,299 ج.م`.
  - **Editorial/prose copy may use Eastern Arabic digits** (`٠-٩`) when it reads better.
- `Intl.PluralRules("ar")` / ICU messages for pluralized copy — no `n === 1 ?` string hacks.
- Dates: `Intl.DateTimeFormat("ar-EG", { calendar: "gregory", timeZone: "Africa/Cairo" })`.

## Honesty (portfolio product)
- No invented metrics, ratings, review counts, buyer counts, countdowns, or discount percentages.
- Demo/placeholder content is labeled as such. Checkout is always marked simulated
  (`payment_mode = DEMO`).

## Quality gates
`pnpm typecheck` (`vue-tsc --noEmit`) + `pnpm lint` + cart/checkout tests must pass; verify UI with
screenshots at 390/768/1440 before claiming anything visually works.
