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
- **NO third-party brand/app icons or logos — ever** (WhatsApp, Instagram, Telegram, X, TikTok,
  Facebook, Visa, Mastercard, PayPal, etc.), and no simplified/lookalike recreations. Use the
  generic Lucide icon or plain text instead (footer socials = generic glyphs; payment trust row =
  `CreditCard`). Standing user rule (2026-10-16) — see PLAN "Footer brand icons".
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

## i18n (AR/EN, `@nuxtjs/i18n` v10, composition API, `legacy:false`)
- UI copy lives in merged locale JSON (`i18n/locales/*.json`), never hardcoded in a page/component.
- **Pages fragment:** `ar.storefront-pages.json` + `en.storefront-pages.json`, namespaced by page
  short name (`home|product|category|cart|checkout|account|login|register|wishlist|search`).
  ar/en trees must have **exactly matching keys** (verify with a sorted-key compare, not by eye).
- **Access:** `const { t, locale } = useI18n()` (`locale` only where the EN variant is toggled).
  Prefer existing `common.*` / `header.*` / `nav.*` / `status.*` / `error.*` keys over new duplicates.
- **Bilingual DTO fields** (`titleAr/titleEn`, `nameAr/nameEn`, `descriptionAr/descriptionEn`) →
  `useLocalized().pick(ar, en)`. **API snapshots / stored data** (`productTitleAr`,
  `productTitleSnapshot`, `order.governorate`, `EGYPT_GOVERNORATES`) stay as-is — data, not UI copy.
- Reactive `<title>`: `useHead(() => ({ title: \`${t('header.brand')} — ${t('…')}\` }))`.
- Dates via `useAdminDateFormat().adminFormatDate(iso)` (locale-bound); never a hardcoded `Intl` locale tag.
- Plurals via ICU `t('key', { count })` (vue-i18n reads `named.count` for the plural index) — no
  `n === 1 ?` hacks. Latin digits for commerce numbers (see "Numbers & numerals").
- Keep function/local names that mirror logic (e.g. `arabicFor(code)`) — swap the returned literal
  for `t()`, don't rename logic to hide the change.

## Honesty (portfolio product)
- No invented metrics, ratings, review counts, buyer counts, countdowns, or discount percentages.
- Demo/placeholder content is labeled as such. Checkout is always marked simulated
  (`payment_mode = DEMO`).

## Quality gates
`pnpm typecheck` (`vue-tsc --noEmit`) + `pnpm lint` + cart/checkout tests must pass; verify UI with
screenshots at 390/768/1440 before claiming anything visually works.
