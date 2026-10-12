# Motion & Structure Spec — goodsandu.com/ar (extracted 2026-10-11)

STUDY ONLY. Re-implement from these measurements; do not copy text, media or source.
Boundary: match layout/motion relationships; use Nimbus Mart's own content, name, images.

## Libraries (verified)
- next: true. No GSAP / ScrollTrigger / Lenis / Framer. Motion = **CSS transitions + Swiper** only.
- Swiper (hero + category carousel). font-family: Alexandria (weights 400–900).

## Tokens (from :root CSS vars)
--background #fff · --foreground #0c287b · --primary #073ce2 · --primary-fg #fff
--brand-yellow #e3fa04 · --brand-blue #073ce1 · --secondary #f3f4f6
--muted #737373 · --border #e5e7eb · --radius .75rem (12px) · metaThemeColor #0C287B
Body text #555. Container max-width 1330px. Footer bg #F3F4F6.

## Type scale (desktop → mobile)
h1 56/72.8 w900 ls-1.4 #333 → 32/41.6 ls-0.8
h2  32/32  w700 #0C287B → 19/19
h3  14/20  w700 #0C287B (card title) → 11/15.7
p   18/28.8 w700 #555 → 15/24
a/nav/button 16/24 w400 #073CE1

## Page order (desktop y → h)
1 header  160px sticky, shadow 0 2px 10px #00000005
2 hero    491px full-bleed image slider (bg image object-cover), text overlay, 3 dots bottom-center
3 category section 270px — 7 image tiles (139×154, img wrap 122×122 rounded-20 bg-white)
4 products section 1242px — title + tabs + 4×2 grid
5 promo banner 1 505px — full-width rounded, kitchen, lime CTA
6 category carousel section 688px — Swiper, slidesPerView 8/6/4, spaceBetween 20, autoplay 3000
7 promo banner 2 505px — summer/beach, lime CTA
8 countdown section 656px — navy band, 4 white circle timer boxes + product grid
9 footer 432px bg #F3F4F6, 3 link cols + brand col, 4 social icons

## Header (2 zones; mobile adds a 60px top utility strip)
- Left: logo 176×72 + search (h44 md:rounded-[24px] border-2 #073CE2, ph "ابحث عن منتجات، ماركات وأكثر")
- Right: track-order package icon (36px round, hover bg-gray-100) · login pill
  (border-2 #073CE2, hover fill #073CE2/white) · EN chip (bg-gray-50 border-gray-100,
  font-black text-[10px] uppercase, globe w-3) · EGP text button + Egypt flag (hover opacity-70)
- Yellow category nav bar below header: bg #E3FA04, py-2.5 (56px), shadow 0 4px 6px #0632BC30,
  links #0C287B text-sm, ~11 items + المزيد. NO Lucide icons inside the nav links (text only).

## Hero (full-bleed, NOT a bordered card)
- .relative w-full h-[70vh] md:h-[491px] overflow-hidden
- Layer z-0: background img object-cover (desktop + separate mobile src)
- Layer: Cloudinary banner img object-contain (products on right in RTL)
- Text overlay (RTL, sits RIGHT side): h1 56 w900 #333 + p 18 w700 #555 + lime CTA
- Pagination: 3 dots bottom-center. speed 300. Side arrow buttons (44px white circles w/ chevrons) also present.

## Product card (matches live exactly)
outer: relative block w-full overflow-hidden rounded-[12px] bg-white aspect-[1/1.2] md:aspect-[1/1.1]
wrap:  relative bg-white rounded-[16px] p-2 md:p-3 flex flex-col h-full transition-all duration-300
       shadow-[0_4px_20px_rgba(0,0,0,.08)] hover:shadow-[0_8px_30px_rgba(12,40,123,.18)] border border-gray-100
img:   object-contain p-1 md:p-2 transition-all duration-500 ease-out group-hover:scale-105
badges top-1.5 right-1.5 (discount pill #E3FA04 + "وصل حديثًا" pill), flex-col gap-1
hover action box: absolute top-2 left-2 flex-col gap-2 opacity-0 group-hover:opacity-100
  transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0
  → 2 buttons 40×40 rounded-xl bg-white text-[#0C287B] hover:bg-[#0C287B] hover:text-white
     (1 = eye/حدد الخيارات "Select options", 2 = heart/wishlist)
title: 14/20 w700 #0C287B clamp-2
stars: "(0)" grey  ·  color dots: 16–20px rounded-full border shadow-sm transition-all hover:scale-110,
  selected = ring-2 ring-[#0C287B] ring-offset-1
price: 14 w900 #0C287B; struck original in grey
btn:   w-full h-10 md:h-12 rounded-[12px] font-black text-[13px] bg #E3FA04 text #073CE2 "أضف إلى السلة"

## Category tile
a.flex.flex-col.items-center.gap-3.group  (139×154)
img wrap: relative w-[122px] h-[122px] bg-white rounded-[20px] p-[10px] border border-transparent
  transition-all duration-300 ease-out group-hover:-translate-y-…
img: object-cover transition-transform duration-500 ease-out group-hover:scale-110
label below: w700 #0C287B

## Tabs (shadcn Tabs)
tabs-list: inline-flex w-fit rounded-lg p-[3px] h-8
tab active: text-[#0C287B]; inactive: text-[#9CA3AF]. 3 tabs: وصل حديثًا · الأكثر مبيعًا · منتجات مميزة

## Countdown ("نهاية الاستوكات")
navy band (#0C287B). Sub "لفترة محدودة - الحق قبل النفاذ".
4 timer boxes: w-[42px] h-[42px] md:w-[48px] md:h-[48px] rounded-full bg-white
  text-[#0A2167] font-ext… + labels أيام/ساعات/دقائق/ثواني. Live JS tick.

## Motion inventory (must implement)
- product img zoom  scale(1.05)  500ms ease-out          (group-hover)
- category img zoom scale(1.10)  500ms ease-out          (group-hover)
- card shadow/lift  transition-all 300ms
- hover action box  opacity + translateX(-8→0) 300ms
- color dot         scale(1.10) on hover
- login pill        bg+color flip 300ms cubic-bezier(.4,0,.2,1)
- search border     300ms
- notification ping animate-ping 1000ms linear infinite (opacity 20%, bg #0C287B)
- hero + category   Swiper: speed 300; hero autoplay 4000 loop (dots);
                    category autoplay 3000, slidesPerView 8/6/4 spaceBetween 20
- countdown         JS interval 1s
All wrapped by prefers-reduced-motion (keep color, drop transforms/ping).

## Gaps vs previous preview (what was missing)
- yellow category nav bar, full-bleed hero slider, category IMAGE tiles, 3 product tabs,
  2 promo banners, countdown section, footer socials, card hover action buttons,
  color swatches, struck-through prices, exact brand palette (#0C287B/#073CE2/#E3FA04).
