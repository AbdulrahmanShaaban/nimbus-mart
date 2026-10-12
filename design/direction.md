# Design direction: Nimbus Mart

## Concept
Nimbus Mart is a clearing-sky morning market: cloud-white paper under storm-ink signage, with one
petrol-blue awning stripe that runs the full width of the page and carries every category and every
primary action, while a single amber sun-break marks the few moments that deserve attention. The name
(nimbus = cloud) drives lightness: airy paper surfaces, thin rules instead of heavy shadows, and type
that sits calm on the page — a storefront that feels like fresh air, not a neon sale floor.

## Audience + language + primary action
Arabic-speaking shoppers in Egypt/Gulf browsing a curated general-goods catalog. Default `lang="ar"
dir="rtl"`. The single primary action everywhere: **add to cart** (secondary: open product detail).

## References (studied, not copied)
1. **https://www.goodsandu.com/ar** (live, fetched 2026-10-11) — borrow the *organizational pattern*:
   persistent header with logo + search + account/cart, a distinct full-width colored category strip
   under the header, a hero band with one headline + one CTA, an image-tile category grid, then tabbed
   product rows, dense policy-link footer. Do NOT copy its logo, images, copy, countdown timers,
   discount badges, or brand identity. Its yellow is theirs; our category strip is petrol blue.
2. **Jordanian/Gulf e-commerce conventions** — persistent search field in the header (never hidden),
   visible category nav without hover-only menus on mobile, EGP pricing in Latin digits, generous
   4-up product grids, policy links (returns/shipping/terms/privacy) surfaced in the footer.
3. **Ledgerly (sibling project)** — engineering reference only: Prisma/Neon/Vercel shape; stack is
   deliberately different here (this project = Nuxt/Vue, ledgerly = Next.js/React). Not a visual
   reference.

## Mood words (exactly 3)
Airy · Assured · Uncluttered

## Palette (custom, 6 swatches)
| Role | Hex | Use |
|---|---|---|
| paper | `#F4F4F1` | page background (cloud white, neutral — not beige) |
| line | `#E2E1DB` | hairline borders, card edges, dividers |
| ink | `#12161B` | headings and body text, dark footer/hero panel |
| primary | `#0E6A8A` | category strip, links, primary buttons (white text on it: 6.2:1) |
| secondary | `#E08A1E` | amber accent: hover underline, wishlist active, focus sparkle — decorative/large only, never body text on paper |
| muted | `#63686D` | meta text, captions, inactive states (4.9:1 on paper) |

Deliberately not the AI-default green+beige and not a purple-blue gradient. Category strip = primary,
never amber — that keeps us clear of the reference's identity.

## Type (Google Fonts, exact families + fallbacks)
| Role | Family | Weights | Fallback stack |
|---|---|---|---|
| Arabic display (hero, section titles) | **Reem Kufi** | 600, 700 | `"Noto Kufi Arabic", Tahoma, sans-serif` |
| Arabic body / UI | **IBM Plex Sans Arabic** | 400, 500, 600 | `"Segoe UI", Tahoma, Arial, sans-serif` |
| Latin display (wordmark, eyebrows, numerals) | **Space Grotesk** | 500, 700 | `ui-sans-serif, system-ui, sans-serif` |

Stack order is Arabic-first: `font-family: var(--font-ar-display), var(--font-ar-body),
var(--font-latin), system-ui, sans-serif` so Arabic glyphs never fall back to a default face.
Hero headline (Reem Kufi 700) ≈ 40–56px; body 16–17px at line-height 1.7; no letter-spacing on Arabic.

## Layout idea
12-column max-width grid, category strip full-bleed under the header, one oversized element per screen
(the hero headline). Radius family: **4px** (sharp-ish, one family only). Surface style: hairline
`line` borders + flat fills — shadows reserved for the sticky header only.

## Signature moment (ONE): "the awning sweep"
On hover/focus of any category-strip link, category tile, or product card, a 3px `primary` bar
sweeps from the inline-start edge to inline-end under the label (plus border shifts `line` → `ink`),
**180ms ease-out**, pure CSS transition. Because it uses `inset-inline-start`, it mirrors correctly in
RTL for free. It repeats once per screen on the category strip, so the whole store reads as one
awning. No other decorative motion.

## Motion personality
Restrained utility. All transitions 150–250ms ease-out; states only: hover, focus-visible, press,
menu open/close. Wrapped in `@media (prefers-reduced-motion: reduce)` → keep color changes, drop
transforms.

## Ban list
- No scroll animations, reveal-on-scroll, parallax, sticky/pinned sections
- No GSAP, ScrollTrigger, Lenis, framer-motion scroll effects
- No generic AI-template look: no centered hero + two buttons + gradient blob, no three equal cards
  as the only layout, no rounded-xl soft-shadow-everywhere, no glassmorphism, no neon glow
- No fake sale badges, fake discount percentages, fake countdown timers, fake stats/testimonials/reviews
- No lorem ipsum or English placeholder text on Arabic screens
- No emoji as icons or decoration; no stock icon sprinkles
- No Cairo+Inter pairing, no purple-to-blue gradients
- No letter-spacing, uppercase transforms, or synthetic italics on Arabic
- Do not copy the reference site's logo, images, copy, or identity
