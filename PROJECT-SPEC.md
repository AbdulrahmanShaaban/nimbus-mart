# Nimbus Mart — Product Spec

**Status:** spec only, NOT BUILT. Docs phase.
**Stack (locked):** Nuxt `4.6.x` (Vue `3.5`, Nitro server engine, Vite) — **this project is
Nuxt/Vue, deliberately different from sibling `ledgerly` (Next.js/React)**. TypeScript `7` strict
(native Go compiler, `typescript@^7.0.2`), Tailwind `4`, Prisma `7.10` (+ `@prisma/adapter-pg`),
ONE PostgreSQL database (Neon), deployed as ONE Vercel app, pnpm. Zod `4` for validation.
- Install/usage of Nuxt conventions comes from the installed **`nuxt`**, **`vue`**, and
  **`nuxt-i18n`** agent skills (onmax/nuxt-skills, MIT). Read those skills + `node_modules/nuxt`
  docs before coding — Nuxt 4 puts Vue app code under `app/` and server code under `server/`.
- Type-check with `vue-tsc` (Nuxt's TS path) — TypeScript 7's faster native compiler is used where
  the toolchain supports it; where Nuxt pins `typescript@5`, keep strict typing regardless.
- Nuxt officially deploys to Vercel (`vercel.com/frameworks/nuxt`) — still ONE app, no separate
  backend.
**Forbidden:** Docker, Redis, BullMQ, separate backend server, n8n cloud, paid AI APIs.

---

## 1. Identity

- **Name:** Nimbus Mart (نِمبوس مارت)
- **Tagline (AR):** «تسوّقٌ خفيف كالسحاب» / (EN): "Shopping as light as a cloud."
- **Type:** Arabic-first RTL e-commerce storefront + admin panel. Portfolio product, not a real shop.
- **Language:** UI Arabic, `<html lang="ar" dir="rtl">` default. Bilingual-ready: content rows carry
  `name_en` / `description_en` nullable columns, but no EN UI in MVP.
- **Honesty rule:** never invent metrics, review counts, buyer counts, or discounts. Every
  placeholder image/copy is marked as demo content in the seed.

## 2. MVP scope (in)

### Storefront
1. **Header (sticky, single compact row — Goods&U pattern):** logo/wordmark, persistent search
   input (Arabic-normalized), wishlist/bell/cart icons (Lucide, cart count badge), **currency
   switcher (EGP/USD/EUR/SAR/AED)**, EN toggle, account/login. NO separate utility bar — all
   header controls live in one row to keep the navbar short. Mobile: wraps to two rows (search
   full-width below), hamburger drawer for nav (CSS transition only). Currency choice persists
   in a cookie; all displayed prices convert live from the base price.
2. **Category strip:** full-width amber band below header listing top-level categories with
   Lucide icons (the Goods&U organizational pattern, our own identity/colors).
3. **Hero:** Swiper carousel (speed 300ms, loop, autoplay 4s, pagination + arrows), one headline
   + one subline + one CTA per slide. Asymmetric composition, not centered two-button.
4. **Category strip/grid:** circular tiles with Lucide icons linking to category pages; hover
   = translateY(-3px) + shadow (180ms).
5. **Product listing** (`/search` + `/categories/[slug]`): filters (category, price range in cents,
   in-stock only) and sort (newest, price asc, price desc). URL-driven filter state.
6. **Product detail** (`/products/[slug]`): gallery, title, description, price,
   **variant pickers (size / color)**, stock display, quantity stepper, add-to-cart, wishlist toggle.
   Product card hover: image `scale(1.05)` over 500ms ease-out (the Goods&U zoom), card lifts
   `translateY(-4px)` + shadow over 300ms.
7. **Cart** (`/cart`): works for guests (session cookie) and logged-in users (DB), survives refresh,
   merge guest cart on login. Line edit/remove, quantities, subtotal = Σ(line totals).
8. **Wishlist** (`/wishlist`): persisted per logged-in user (login required, with friendly nudge).
9. **Checkout** (`/checkout`): form (name, phone, governorate, address) → creates a **real order row
   in Postgres**. **NO real payment:** no gateway, no card fields. The page, the button, the success
   page and the order record are all explicitly labeled demo/simulated («طلب تجريبي — لا يوجد دفع
   فعلي»). Payment mode is a fixed `demo` value on the order.
10. **Account:** profile + order history with order number.

### Product images (DummyJSON)
- Seed products use **real image URLs from the DummyJSON CDN** (`https://cdn.dummyjson.com/product-images/...`)
  — stable public webp URLs, no runtime API dependency, no licensing issue (DummyJSON is free for demos).
- Images are stored as ordinary `url` columns (`product_images.url`, `variants.image_url`) and are
  fully editable from the admin (see CMS below). Swapping a URL in admin instantly changes the
  storefront. No local image hosting, no upload pipeline in MVP (roadmap).
- Honesty: footer + admin mark图片来源 as "Demo images via DummyJSON". Never claim them as the
  store's own photography.

### Admin (`/admin`, ADMIN role only) — dashboard + CMS + orders CRM
- **CMS — Content manager** (the "I want to change images and things" surface):
  - Hero slides editor: title, subtitle, CTA label, CTA link, background style, order, enabled flag.
  - Category editor: name_ar/name_en, icon (Lucide name from a fixed list), sort, enabled.
  - Product image editor: add/remove/reorder image URLs per product; edit variant image URL;
    paste any URL (DummyJSON CDN or other) — no file upload in MVP.
  - Promo banner editor: heading, body, CTA, gradient preset.
- **Products catalog:** CRUD (incl. per-product variants: size/color/stock/price override),
  draft/active status.
- **Orders CRM:** list + detail + status transitions (`placed → processing → shipped → delivered |
  cancelled`), customer contact info, order timeline. This is the customer/relationship surface —
  no separate CRM product in MVP.
- **Customers:** users list + role assignment (`CUSTOMER` / `ADMIN`), per-customer order history.
- Stock adjustment (increment/decrement with reason, audited).
- **Currency rates editor** (`/admin/currencies`): one row per currency — code, rate vs base
  (decimal, e.g. `0.020` for USD when base is EGP), symbol, position (before/after), decimals,
  rounding step, enabled flag, last-updated timestamp. Admin sets the RATE only — never a price
  per product per currency. Rate = "1 base currency = N target currency units".
- Audit log viewer (read-only).

### Explicit non-goals (out)
Payment gateway, real shipping rates/tracking, email/SMS sending, reviews/ratings, coupons/discounts,
recommendations, EN UI, SEO blog, CDN image pipeline, analytics beyond Vercel basics.
Multi-currency IS in scope (see §5) — but only as display conversion + order snapshot, never as
per-currency admin price entry, never as real FX payment conversion.

## 3. Routes

### Public
| Route | Purpose |
|---|---|
| `/` | Home: hero, category grid, featured rows |
| `/categories/[slug]` | Category listing (filters + sort) |
| `/search?q=` | Search results (Arabic-normalized match) |
| `/products/[slug]` | Product detail with variants |
| `/cart` | Cart (guest or user) |
| `/wishlist` | Wishlist (auth required) |
| `/checkout` | Checkout form (demo order creation) |
| `/checkout/success?order=` | Confirmation with order number + demo banner |
| `/login`, `/register` | Auth |
| `/account`, `/account/orders` | Profile, order history |

### Admin (role gate in middleware + server checks)
`/admin` (overview) · `/admin/products` + `/admin/products/new` + `/admin/products/[id]` ·
`/admin/variants/[id]` (edit inline) · `/admin/orders` + `/admin/orders/[id]` ·
`/admin/customers` · `/admin/content` (CMS: hero slides, categories, promo banner) ·
`/admin/currencies` · `/admin/audit`

### API (Nitro server routes in `server/api/`, Zod-validated)
`GET  /api/products` (search/filter/sort/pagination) ·
`GET  /api/products/[slug]` ·
`POST /api/cart/items` · `PATCH /api/cart/items/[id]` · `DELETE /api/cart/items/[id]` ·
`POST /api/wishlist/items` · `DELETE /api/wishlist/items/[product]` ·
`POST /api/checkout` (**Idempotency-Key required**) ·
`POST /api/auth/login` · `POST /api/auth/register` · `POST /api/auth/logout` ·
Admin: `POST/PATCH/DELETE /api/admin/products…`, `PATCH /api/admin/orders/[id]`,
`PATCH /api/admin/users/[id]`, `POST/PATCH/DELETE /api/admin/content…`,
`PATCH /api/admin/currencies/[code]`

## 4. DB schema sketch (Prisma, snake_case via `@map`, money = integer cents BIGINT)

> All money columns: `BigInt` mapped to `BIGINT`, unit = **cents (piastres)**. Never floats.
> IDs: `text` cuid/uuid. Timestamps `timestamptz`, stored UTC.

- **users**: `id`, `email` unique, `password_hash`, `name`, `phone` nullable,
  `role` enum(`CUSTOMER`,`ADMIN`) default `CUSTOMER`, `created_at`, `updated_at`
- **categories**: `id`, `slug` unique, `name_ar`, `name_en` nullable, `parent_id` nullable FK,
  `sort_order`, `created_at`
- **products**: `id`, `slug` unique, `category_id` FK, `title_ar`, `title_en` nullable,
  `description_ar`, `description_en` nullable, `price_cents` BIGINT (base price),
  `status` enum(`DRAFT`,`ACTIVE`,`ARCHIVED`), `search_normalized` (generated/maintained column),
  `created_at`, `updated_at`
- **variants**: `id`, `product_id` FK, `sku` unique, `size` nullable, `color` nullable,
  `color_hex` nullable, `price_cents` BIGINT nullable (override; null = product price),
  `stock` int default 0, `created_at`
- **cart_items**: `id`, `variant_id` FK, `quantity` int check(1..99),
  `user_id` nullable FK, `session_id` nullable (guest cookie), `created_at`,
  `updated_at` — CHECK exactly one of (`user_id`,`session_id`) set;
  UNIQUE (`user_id`,`variant_id`) / UNIQUE (`session_id`,`variant_id`)
- **orders**: `id`, `order_number` unique (human-readable e.g. `NM-2026-000123`), `user_id` nullable,
  `email`, `name`, `phone`, `governorate`, `address_line`, `status` enum
  (`PLACED`,`PROCESSING`,`SHIPPED`,`DELIVERED`,`CANCELLED`),
  `payment_mode` enum default `DEMO` (always DEMO — no gateway exists),
  `subtotal_cents` BIGINT, `shipping_cents` BIGINT default 0, `total_cents` BIGINT,
  **currency snapshot**: `currency_code` (e.g. `EGP` — the base, always stored),
  `display_currency_code` (what the buyer saw, e.g. `USD`), `fx_rate` DECIMAL(18,8)
  (rate locked at purchase time), `display_subtotal_minor` BIGINT, `display_total_minor` BIGINT
  (converted+rounded totals in display currency, minor units), so later rate changes never
  rewrite order history,
  `idempotency_key` TEXT UNIQUE NOT NULL, `created_at`, `updated_at`
- **order_items**: `id`, `order_id` FK, `variant_id` FK, `product_title_snapshot`,
  `variant_snapshot` (e.g. "M / أزرق"), `unit_price_cents` BIGINT (base currency), `quantity` int,
  `line_total_cents` BIGINT, `display_unit_price_minor` BIGINT nullable (snapshot)

**Supporting tables:** `product_images` (id, product_id, url, sort), `wishlists`
(user_id, product_id, unique pair), `audit_logs` (id, actor_user_id, action, entity, entity_id,
`before` jsonb, `after` jsonb, `created_at`), `sessions` (if DB sessions chosen).
- **currency_rates**: `id`, `code` unique (`EGP`,`USD`,`EUR`,`SAR`,`AED`), `rate` DECIMAL(18,8)
  (units of this currency per 1 base unit; base row has rate = 1), `symbol`, `position`
  enum(`BEFORE`,`AFTER`), `decimals` int default 2, `rounding_step_cents` bigint nullable
  (null = no rounding), `enabled` boolean default true, `updated_at`.
- **CMS tables** (admin-editable content):
  - `hero_slides`: `id`, `title_ar`, `subtitle_ar` nullable, `cta_label_ar`, `cta_href`,
    `bg_style` enum(`BLUE`,`AMBER`,`INK`), `sort_order`, `enabled` bool, `updated_at`.
  - `site_settings`: single-row-ish key/value or typed columns for the promo banner
    (`promo_heading_ar`, `promo_body_ar`, `promo_cta_label_ar`, `promo_cta_href`, `promo_gradient`)
    + footer blurb. Edited via `/admin/content`.
  - categories gain `icon` TEXT (a Lucide icon name from a fixed allow-list, e.g. `smartphone`)
    + `enabled` bool, so the admin can change which icon shows on the category strip.

**Seed:** ~8 categories (with Lucide icon names), ~30 products with variants + **DummyJSON CDN
image URLs** (real webp thumbnails, stored in `product_images.url` / `variants.image_url`),
2 hero slides, 1 promo banner, 1 ADMIN user (`admin@nimbus.app` / `admin1234`), 2 CUSTOMER users.
All copy realistic Arabic; no fake stats; footer + admin label图片来源 as DummyJSON demo images.

## 5. Core behaviors

### Multi-currency (display conversion — the Shopify/CS-Cart model, simplified)
- **Base currency: EGP.** Every `price_cents` / `unit_price_cents` / `line_total_cents` in the DB
  is EGP piastres. Admin never enters a second price per product — one price, one currency.
- **Rates table (`currency_rates`)** holds one row per currency: `rate` = units of that currency
  per 1 EGP (USD ≈ 0.020, SAR ≈ 0.076, etc.). Admin edits rates in `/admin/currencies`; seeded
  with plausible rates marked as demo. No external FX API in MVP (manual rates = no paid
  dependency, works offline, still demonstrates the real pattern).
- **Conversion (display only):** `display_minor = round_minor(base_cents × rate)` where
  `round_minor` applies the currency's `decimals` + optional `rounding_step_cents` (e.g. round
  to nearest 50 piastres for a cleaner ending). All conversion math uses integer/`BigInt` or
  fixed-decimal — never float.
- **Currency switcher:** header dropdown; selection stored in a `nm_currency` cookie (default
  `EGP`). Every product card, cart line, and checkout summary renders in the selected currency
  by converting from base at render time. Switching never touches the DB.
- **Order snapshot at checkout:** the order row stores `currency_code` (base `EGP`),
  `display_currency_code`, `fx_rate` (the rate at that moment), and pre-computed
  `display_subtotal_minor` / `display_total_minor`. Order history and admin order detail always
  show the base EGP amounts plus the locked display amounts — a later rate change cannot rewrite
  a placed order. This is the auditability signal.
- **Honesty:** a small note on checkout in non-EGP currencies: «الأسعار المعروضة تقريبية بسعر
  صرف تجريبي — المبلغ الفعلي بالجنيه المصري» ("displayed prices are approximate at a demo FX
  rate — the charged amount is in EGP").

### Cart math (tested)
`line_total = unit_price_cents × quantity` · `subtotal = Σ line_total` ·
`total = subtotal + shipping_cents` · all in `BigInt`/integer math, no floats. Quantity clamped 1–99.
Stock capped: add/patch quantity never exceeds `variant.stock`.

### Checkout (transaction + idempotency)
1. Validate payload (Zod): items, contact, address; re-read prices from DB (never trust client).
2. Require `Idempotency-Key` (UUID generated client-side, persisted with the form session).
3. In ONE transaction: create order with `idempotency_key` (on conflict → return existing order),
   create `order_items` from DB prices, decrement `variants.stock` with a guarded conditional update
   (`stock >= qty` else abort), clear the purchaser's cart.
4. Return `order_number`; success page shows demo banner.

### Depth signals (portfolio proof)
- **Idempotency:** unique `orders.idempotency_key`; double-submit/retry returns the same order, no
  duplicate rows, no double stock decrement. Tested.
- **Audit log:** every admin product/stock/order-status/user-role mutation writes `audit_logs`
  (actor, entity, before/after). Visible in `/admin/audit`.
- **Tests for cart math:** unit tests (Vitest) covering line totals, quantity clamps, subtotal/total,
  BigInt edge values (e.g. `99 × 199999`), idempotent checkout replay, stock-guard abort.
- **Arabic search normalization:** `normalizeArabic()` (strip tashkeel/tatweel, آأإ→ا, ى→ي, digit
  unify) applied to both `search_normalized` and the query.

## 6. Acceptance criteria ("done" means)

1. Every visible button/link does something real — no dead controls anywhere in storefront or admin.
2. Cart survives a full page refresh (guest cookie AND logged-in DB), and merges on login.
3. Checkout creates a row in `orders` + `order_items` visible in the DB and in `/admin/orders`;
   replaying the same idempotency key does not create a second order.
4. Variant selection changes price/stock shown and is what gets ordered.
5. Admin CRUD works end-to-end; roles enforced (customer gets 403 on `/admin` and admin APIs).
6. Verified at 390px and 1440px widths with real screenshots: RTL correct, no overflow, no
   horizontal scroll, `lang/dir` right, console clean.
7. `pnpm typecheck` (tsc --noEmit) and `pnpm lint` pass; cart/checkout tests pass.
8. `prefers-reduced-motion` honored; only 150–250ms state transitions exist — no scroll animation.
9. Demo labeling present on checkout, success page, and every admin order record.
10. Currency switcher converts every visible price from base EGP correctly (unit-tested rounding);
    an order placed in USD stores a locked `fx_rate` + display totals that do not change when the
    admin edits the rate afterwards.
