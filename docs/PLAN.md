# PLAN — Nimbus Mart

**Status: BUILD COMPLETE + FIDELITY AUDIT DONE + LIVE ON GITHUB & VERCEL (2026-10-12) + RESPONSIVE FIX DEPLOYED (2026-10-13).**
Design gate passed (user picked **Preview B** «السوق النابض» v3, Goods&U structural parity).
Storefront + admin fully implemented against Neon Postgres; verification gates green.
Fidelity audit vs `https://www.goodsandu.com/ar` completed (all deltas fixed, screenshots saved);
all "موك أب/تجريبي" demo wording removed — site presents as real sales.

## Verification evidence (2026-10-12)

| Gate | Result |
| --- | --- |
| `pnpm lint` (ESLint via `@nuxt/eslint`) | 0 errors, 0 warnings (`scripts/**` ignored as dev harness) |
| `pnpm typecheck` (nuxt typecheck / vue-tsc) | EXIT 0 |
| `pnpm test` (Vitest) | 17/17 pass (`tests/money.test.ts`, `tests/normalize-ar.test.ts`) |
| `pnpm build` (production Nitro build) | EXIT 0 — 1m40s, 10.7 MB (3.15 MB gzip) |
| `pnpm exec tsx scripts/smoke.ts` (API + SSR, vs live dev server :3001) | 62/62 pass — verified repeatable (2 consecutive runs); self-healing stock floor + in-stock variant selection; includes order-notes persistence |
| Browser UI checkout (guest, Chrome DevTools, mobile 390) | order `NM-MV592DKE-C2C944` placed, success page rendered |
| Browser admin login + dashboard (Chrome DevTools, desktop 1440) | stats/products/orders/customers/revenue + low-stock render |
| Browser admin sub-pages (desktop 1440) | orders list + order detail (notes row live), content, currencies, audit all render |
| Browser admin mobile (390) | horizontal nav + stacked rows, zero horizontal overflow |
| Console during verified flows | clean (no errors; only Vite debug + Suspense info + lazy-image advisory) |
| RTL / overflow check at 390 | no horizontal overflow; logical CSS only |

Smoke covers: catalog (list/detail/search/sale/min-max filters/404), guest cart add/patch,
login with guest-cart merge, account, wishlist toggle consistency, idempotent checkout
(replay returns same orderNumber) with `notes` persisted and readable on the owner view,
order clear-cart, register, full admin API surface
(stats/products/orders/users/audit/settings/currencies/hero-slides/status PATCH),
admin API blocked for customers (401/403), SSR pages 200, anon protected-page redirects,
admin/customer SSR access rules.

## Responsive regression + fix (2026-10-13, commit `ea1413d`)

The 10-12 "zero overflow at 390" evidence covered the **admin** layout only. A page-scan of
every storefront route at 360/390 found the shared `AppHeader` action-group overflowing left
on **all** storefront pages (guest 16px @390 / 46px @360, +44px more when the admin icon
showed) → horizontal scroll + clipped cart icon. Fix: mobile row `gap-1.5 px-3`
(`md:` unchanged), logo `text-lg` + `truncate` safety net, action-group `gap-0 md:gap-2`,
mobile-only user icon removed (hamburger menu already links account/login), admin icon now
`md:grid` + added to the mobile menu.

| Gate (after fix) | Result |
| --- | --- |
| `documentElement.scrollWidth` at 360/390/768/1440 | equals viewport minus scrollbar on `/`, `/products`, `/checkout`, `/login`, `/cart`, `/categories/mens-shirts`, `/account`, `/wishlist` — zero unclipped offenders |
| Logo truncation @360/@390 | none (`scrollWidth == clientWidth`, 125/125) |
| md/desktop header (768/1440) | unchanged — pill + currency + admin icon, row 88px, no overflow |
| `pnpm lint` / `pnpm typecheck` | EXIT 0 / EXIT 0 |
| Screenshots | `design/shots/resp-{home,checkout,admin}-390-after.png`, `resp-home-360-after.png` |

## Mobile design polish (2026-10-13, commit `5cdd572`)

User request: "ال responsive design مش حلو خالص" — beyond overflow, improve mobile
**quality** across all pages. All changes are `<md` only; desktop (768/1440) verified
unchanged. Design system untouched (Preview B palette/type).

| Area | Change |
| --- | --- |
| HeroSwiper | Fixed `h-[450px]` (was `70vh max-h-491`), text top-aligned (`max-md:justify-start max-md:pt-10`), heading `clamp(28px…)`, subtitle `text-sm`, CTA `px-6 py-3 text-sm` — CTA no longer overlaps the product image |
| AppHeader strip | ChevronDown `hidden md:block` + chips drop `max-w-[96px]` on mobile — no mid-word truncation ("الإلكتروني⌄") |
| AppFooter | Link + category lists → `grid-cols-2` on mobile, container `py-10`, tighter gaps; payment strip `p-5` |
| ProductBrowser | Collapsible filter panel on mobile: toggle button (aria-expanded), collapsed by default — catalog grid no longer pushed below the fold |
| PromoSplit | Removed `min-h-[300px]` dead space (`max-md:min-h-0`), `p-6`, heading clamp `24px` — promos hug content |
| SectionHeader | Mobile `text-xl` (was `text-2xl`), `mb-4` |
| EmptyState | `py-10` on mobile |
| FAB (chat) | `h-12 w-12 bottom-4 end-4` on mobile (was `h-14 bottom-6`) |

Evidence: screenshots `design/shots/polish-{home-390-v1..v4, home-1440, pdp-390,
pdp-390-v2, products-390, products-390-v2, products-390-v3}.png`;
`scrollWidth` checks: 360 → 345/360, 390 → 375/390, 768 → 753/768 — zero offenders,
zero overflow; filter toggle exercised open/closed at 390; `pnpm lint` +
`pnpm typecheck` EXIT 0.

## What was built

- **Stack (actual):** Nuxt 4.6.1, Vue 3.5.43, vue-router 5.4.0, TypeScript 5.9.3
  (TS7 abandoned → fallback), Tailwind 4.3.3 + `@tailwindcss/vite`, Prisma 7.10 +
  `@prisma/adapter-pg` (Neon), Zod 4.6.5, Swiper 11, **`@lucide/vue`** (lucide-vue-next
  deprecated), Vitest 3.2.7, tsx, pnpm 12, ESLint 10 + `@nuxt/eslint` (lint gate: 0 errors;
  `scripts/**` ignored — dev-only harness).
- **Prisma 7 specifics:** no `url` in schema datasource; `prisma.config.ts` (migrations +
  seed via `tsx prisma/seed.ts` + `env('DATABASE_URL')`); generator `prisma-client` output
  `server/generated/prisma` (TS-only client, relative imports).
- **DB:** migrations `20261011204609_init` + `20261012111044_add_compare_at` +
  `20261012133623_add_order_notes` applied to Neon.
  Seed: 3 users, 12 categories, 50 products, 62 variants, 50 images, 3 hero slides,
  5 currencies; 7 products carry `compareAtCents`. Smoke is repeatable: it restores
  variants with stock < 3 to 5 at start and picks an in-stock variant; `scripts/restock.ts`
  is the manual equivalent.
- **Auth:** hand-rolled scrypt + HTTP-only `nm_session` cookie; `nm_sid` guest cart cookie;
  `nm_currency` display currency. Login merges guest cart into user cart.
- **Server:** `server/utils/{db,session,audit,cart,password}.ts`; APIs for auth, account,
  products (min/max EGP price filter), categories, content (home/footer), cart, wishlist,
  checkout (Idempotency-Key, transaction, stock guard, `notes` persisted to
  `Order.notes` and shown in account + admin order detail), orders, currencies, admin
  (stats incl. lowStockItems, products CRUD, orders + status, users, audit, settings,
  currencies, hero-slides).
- **Storefront (19 components + 14 pages):** AppHeader (2-zone + yellow category nav,
  admin dashboard link for ADMIN role) / AppFooter, HeroSwiper, CategoryGrid, ProductCard,
  ProductBrowser (URL-driven filters), CountdownDeal, PromoSplit, QtyStepper, EmptyState,
  StatusBadge…; pages: home, products list/detail, search, category, cart, checkout,
  success, wishlist, login, register, account (+orders list/detail), error.vue.
- **Admin (10 pages + layout):** dashboard (stats, low-stock, recent orders), products
  (+ ProductForm), orders (+ detail/status flow), users, content (hero slides + settings),
  currencies, audit; `app/layouts/admin.vue`, `middleware/admin.ts`.
- **Composables:** `useAuth` / `useCart` / `useCurrency` — `useState`-based, SSR-safe;
  all authed `useAsyncData` calls use `useRequestFetch` (cookie forwarding on SSR).

## Decisions locked (history)

- Design: Preview B v3 tokens — Alexandria 400–900, navy `#0C287B`, brand `#073CE2`,
  neon `#E3FA04`, container 1330px, img zoom 1.05/500ms, Swiper hero 300/loop/4s.
- Images: DummyJSON CDN URLs, admin-swappable; no upload pipeline in MVP.
- Money: BigInt cents, serialized as strings in JSON; display conversion via
  `currency_rates` (base EGP, manual rates, order snapshot). Unit-tested.
- Auth: hand-rolled session cookie (ledgerly pattern), no Auth.js. PINNED.
- Icons: Lucide only (`@lucide/vue`); brand socials = inline SVG; zero emoji.
- Dev server: port **3001** (3000 occupied by Radd); launch detached — shell-tool
  timeouts kill foreground servers.

## Fidelity audit vs Goods&U (2026-10-12)

Reference: `https://www.goodsandu.com/ar`, extraction cached at `design/reference/goodsandu/`
(report/analysis/rendered.html/css/shots). STUDY ONLY. Screenshots of ours:
`design/reference/ours-final-top-1440.png`, `ours-final-full-1440.png` (+ ref `ref-top-1440.png`).

**Deltas found → fixed:**
- Header: search magnifier moved to pill END; login pill = text only (no icon);
  currency pill = text + chevron (no EN switcher — no i18n; no flag emoji — no-emoji rule).
- Neon nav: `gap-0`, `text-[13px]`, labels allowed to wrap 2 lines (`max-w-[96px]` category
  links) — all items + "المزيد" fit at 1440 (`navOverflow: 0`). Kept "الرئيسية" (our UX choice;
  reference has none) and 12 categories (reference has ~7 + المزيد).
- Category strip: borderless 96px tiles, responsive grid (mobile scroll → `md:grid-cols-6`
  → `xl:grid-cols-12`), navy labels, no heading/counts — all 12 tiles visible at 1440.
- Homepage order rebuilt: Hero (light gradient, navy text, neon CTA, navy dots) → category
  strip → "موصى به لك" (centered, tabs, real data incl. new `bestSellers`) → kitchen promo →
  "تشكيلة مختارة" carousel → peach summer banner → compact countdown (dark `#071C55`
  circle timers) + sale row → light footer (`#F3F4F6`, gray links, black social circles).
- Product cards: blue discount pills + blue prices, neon CTA (`PriceBlock`/`ProductCard`).
- **Cascade bug fixed:** unlayered element rules in `main.css` beat Tailwind utilities
  (invisible FAB icon, blue links everywhere) — wrapped in `@layer base { }`; then explicit
  `text-*` restored where inheritance was wanted (footer links `text-bodytext`, breadcrumbs
  `text-mutedtext`, footer logo `text-navy`).
- Floating support FAB added (`app/layouts/default.vue`): blue circle + MessageCircle icon,
  `mailto:support@nimbusmart.eg` (no fake WhatsApp number).
- Deleted: `PromoStrip.vue` (banner wording), `ImageTiles.vue` (superseded).

**Demo-wording removal ("موك أب تجريبي" → real sales):**
- Code: PromoStrip deleted; checkout note → shipping/returns copy; admin order "طلب تجريبي"
  pill removed + payment label "دفع إلكتروني"; `prisma/seed.ts` demo phrases stripped;
  `nuxt.config.ts` meta description → real-sales copy (verified rendering on :3001).
- DB (seed NOT re-run — destructive): `scripts/retext.ts` updated footer blurb, 18 product
  descriptions, demo user name → "أحمد مصطفى". Grep تريب|موك clean across app/server/seed.

**API addition:** `bestSellers` (variant sales `groupBy` with featured fallback) in
`server/api/content/home.get.ts` + `HomeContentDto.bestSellers` in `app/types/api.ts`.

**Re-verified after audit (all green):** lint 0/0, typecheck EXIT 0, vitest 17/17,
smoke 62/62, `pnpm build` EXIT 0; console clean (only pre-existing lazy-image advisory);
`docOverflow: 0` at 1440 and 500; nav `navOverflow: 0`.

## GitHub + Vercel deployment (2026-10-12, on explicit user request)

- **Git:** `git init -b main` → 155 files committed (secrets excluded: `.env`,
  `server/generated/`, goodsandu third-party `css/` + `rendered.html` gitignored;
  analysis notes + 16 screenshots committed) → pushed to
  `https://github.com/AbdulrahmanShaaban/nimbus-mart.git` (`main` tracking set).
- **README:** official-Nuxt-docs-style `README.md` (setup, commands, env vars table,
  seed demo accounts, docs links) committed + pushed.
- **Build script:** `package.json` build = `prisma generate && nuxt build` so Vercel
  regenerates the gitignored Prisma client each build (verified in build log).
- **Vercel project:** `abdelrahman-shaabans-projects/nimbus-mart` (framework preset
  Nuxt, Node 24, GitHub repo connected → future pushes auto-deploy). Env vars added
  production-scoped BEFORE first build: `DATABASE_URL`, `NUXT_SESSION_SECRET` (both
  Secret; `.env` never committed; `prisma.config.ts` requires `DATABASE_URL` at
  config load).
- **First production deploy:** `vercel deploy --prod --yes` → READY,
  Nitro preset `vercel`, build 29.9s, 10.7 MB (3.15 MB gzip).
  URLs: `https://nimbus-mart.vercel.app` (alias) and deployment URL
  `https://nimbus-mart-k5vbf73n2-abdelrahman-shaabans-projects.vercel.app`.
- **Production verification:** 8 URL checks — `/`, `/api/content/home`, `/products`,
  `/products/green-black-glasses`, `/search?q=قمص`, `/cart`, `/login` → 200;
  unknown path → 404. SSR content: `lang="ar"` ✓, `dir="rtl"` ✓, real-sales meta
  description ✓, FAB `mailto:support@nimbusmart.eg` ✓, no demo wording ✓.

## Known minor follow-ups (non-blocking)

- Chrome advisory: lazy product images lack explicit width/height (containers are
  aspect-square; CLS-safe) — CONVENTIONS forbids img dimension attrs; revisit only if
  a real CLS regression shows.
- Footer social links are `#` placeholders (no real brand URLs supplied).
- `NUXT_SESSION_SECRET` currently the deploy-time value added from local `.env`
  (dev-origin secret) — rotate via `vercel env add NUXT_SESSION_SECRET production`
  with a fresh random string before treating the store as customer-facing.
- Demo accounts seeded in shared Neon DB (admin/demo credentials in `README.md`) —
  fine for portfolio demo; rotate/remove before real traffic.
