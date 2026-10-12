/* Smoke test: boots against a running dev server (default http://localhost:3001). */
import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3001'

class CookieJar {
  private cookies = new Map<string, string>()

  absorb(res: Response): void {
    const raw = (res.headers as Headers).getSetCookie?.() ?? []
    for (const line of raw) {
      const [pair] = line.split(';')
      const idx = pair.indexOf('=')
      if (idx <= 0) continue
      const name = pair.slice(0, idx).trim()
      const value = pair.slice(idx + 1).trim()
      if (value === '' || value === 'deleted') this.cookies.delete(name)
      else this.cookies.set(name, value)
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  }

  get(name: string): string | undefined {
    return this.cookies.get(name)
  }
}

let passed = 0
let failed = 0
const failures: string[] = []

async function req(
  jar: CookieJar,
  method: string,
  path: string,
  opts: { body?: unknown; headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) }
  const cookie = jar.header()
  if (cookie) headers.cookie = cookie
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    redirect: 'manual',
  })
  jar.absorb(res)
  return res
}

async function check(name: string, cond: boolean, detail = ''): Promise<void> {
  if (cond) {
    passed++
    console.log(`PASS  ${name}`)
  } else {
    failed++
    failures.push(name + (detail ? ` — ${detail}` : ''))
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function json(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function errMsg(body: unknown): string {
  if (body && typeof body === 'object' && 'statusMessage' in body) return String((body as any).statusMessage)
  return ''
}

async function main() {
  // Self-healing stock floor: every run consumes seed stock via checkout; keep
  // depleted variants buyable so the cart flow (add 2 → patch 3) stays repeatable.
  try {
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
    const fixed = await db.variant.updateMany({ where: { stock: { lt: 3 } }, data: { stock: 5 } })
    await db.$disconnect()
    if (fixed.count > 0) console.log(`SMOKE stock floor: restored ${fixed.count} variants to 5`)
  } catch (e) {
    console.warn('SMOKE stock floor skipped:', (e as Error).message)
  }

  const guest = new CookieJar()
  const anon = new CookieJar()
  const adminJar = new CookieJar()

  // --- Content / catalog ---
  const home = await json(await req(guest, 'GET', '/api/content/home'))
  await check('GET /api/content/home 200 + heroSlides', !!home && Array.isArray((home as any).heroSlides) && (home as any).heroSlides.length > 0)

  const footer = await json(await req(guest, 'GET', '/api/content/footer'))
  await check('GET /api/content/footer 200', !!footer)

  const cats = await json(await req(guest, 'GET', '/api/categories'))
  const catItems = (cats as any)?.items ?? []
  await check('GET /api/categories ≥12', Array.isArray(catItems) && catItems.length >= 12, `got ${catItems.length}`)

  const prods = (await json(await req(guest, 'GET', '/api/products?limit=5'))) as any
  await check('GET /api/products?limit=5', Array.isArray(prods?.items) && prods.items.length === 5, `got ${prods?.items?.length}`)
  const firstSlug: string = prods?.items?.[0]?.slug
  await check('product card has slug/priceCents', !!firstSlug && typeof prods.items[0].priceCents === 'string')

  const sale = (await json(await req(guest, 'GET', '/api/products?sale=1'))) as any
  await check('GET /api/products?sale=1 non-empty', Array.isArray(sale?.items) && sale.items.length > 0)

  const priced = (await json(await req(guest, 'GET', '/api/products?min=500&max=20000'))) as any
  const inRange = (priced?.items ?? []).every((p: any) => {
    const c = Number(p.priceCents)
    return c >= 500_00 && c <= 20000_00
  })
  await check('GET /api/products min/max EGP filter', Array.isArray(priced?.items) && priced.items.length > 0 && inRange, `n=${priced?.items?.length} inRange=${inRange}`)

  let detail: any = null
  let vid = ''
  for (const p of (prods?.items ?? [])) {
    const d = (await json(await req(guest, 'GET', `/api/products/${p.slug}`))) as any
    if (!d?.slug || !Array.isArray(d.variants)) continue
    const v = d.variants.find((x: any) => typeof x.stock === 'number' && x.stock >= 3)
    if (v) {
      detail = d
      vid = v.id
      break
    }
    if (!detail) detail = d
  }
  await check('GET /api/products/[slug]', !!detail?.slug && Array.isArray(detail.variants) && detail.variants.length > 0, errMsg(detail))
  await check('found in-stock variant (stock ≥ 3)', !!vid, 'no variant with stock>=3 among first 5 products')
  await check('detail has defaultVariantId', !!detail?.defaultVariantId, String(detail?.defaultVariantId))

  const search = (await json(await req(guest, 'GET', '/api/products?q=' + encodeURIComponent('قميص')))) as any
  await check('GET /api/products?q=قميص', Array.isArray(search?.items))

  const missing = await req(guest, 'GET', '/api/products/does-not-exist-xyz')
  await check('GET missing product → 404', missing.status === 404, `status ${missing.status}`)

  // --- Guest cart flow ---
  const cart0 = (await json(await req(guest, 'GET', '/api/cart'))) as any
  await check('GET /api/cart guest empty', !!cart0 && Array.isArray(cart0.items) && cart0.items.length === 0)

  const added = (await json(await req(guest, 'POST', '/api/cart/items', { body: { variantId: vid, quantity: 2 } }))) as any
  await check('POST /api/cart/items', !!added?.items, errMsg(added))
  await check('guest nm_sid cookie set', !!guest.get('nm_sid'))

  const cart1 = (await json(await req(guest, 'GET', '/api/cart'))) as any
  await check('cart has 1 line qty 2', cart1?.items?.length === 1 && cart1.items[0].quantity === 2, JSON.stringify(cart1?.items?.map((i: any) => i.quantity)))
  const cartItemId: string = cart1?.items?.[0]?.id

  const patched = (await json(await req(guest, 'PATCH', `/api/cart/items/${cartItemId}`, { body: { quantity: 3 } }))) as any
  await check('PATCH cart item qty→3', patched?.items?.[0]?.quantity === 3, errMsg(patched))

  // --- Auth: login demo user on the SAME jar (merge guest cart) ---
  const login = await req(guest, 'POST', '/api/auth/login', { body: { email: 'demo@nimbus.app', password: 'demo1234' } })
  const loginBody = await json(login)
  await check('login demo@nimbus.app', login.status === 200 && !!(loginBody as any)?.user, errMsg(loginBody))
  await check('nm_session cookie set', !!guest.get('nm_session'))

  const me = (await json(await req(guest, 'GET', '/api/auth/me'))) as any
  await check('GET /api/auth/me', me?.user?.email === 'demo@nimbus.app', errMsg(me))

  const mergedCart = (await json(await req(guest, 'GET', '/api/cart'))) as any
  await check('guest cart merged on login', mergedCart?.items?.length === 1 && mergedCart.items[0].quantity === 3, JSON.stringify(mergedCart?.items?.map((i: any) => i.quantity)))

  const account = (await json(await req(guest, 'GET', '/api/account'))) as any
  await check('GET /api/account', !!account?.email, errMsg(account))

  const acctOrders = await json(await req(guest, 'GET', '/api/account/orders'))
  await check('GET /api/account/orders', Array.isArray((acctOrders as any)?.items))

  // --- Wishlist (POST is a toggle) ---
  const wishAdd = await json(await req(guest, 'POST', '/api/wishlist', { body: { productId: detail?.productId } })) as any
  await check('POST /api/wishlist', !!wishAdd && typeof wishAdd.inWishlist === 'boolean', errMsg(wishAdd))
  const wishList = (await json(await req(guest, 'GET', '/api/wishlist'))) as any
  const wishHas = Array.isArray(wishList?.items) && wishList.items.some((i: any) => i.productId === detail?.productId)
  await check('GET /api/wishlist consistent with toggle', wishHas === !!wishAdd?.inWishlist, `has=${wishHas} inWishlist=${wishAdd?.inWishlist}`)

  // --- Checkout (idempotent) ---
  const idemKey = `smoke-${Date.now()}`
  const checkoutBody = {
    email: 'demo@nimbus.app',
    name: 'عميل نيمبوس',
    phone: '01001234567',
    governorate: 'القاهرة',
    addressLine: '١٥ شارع التحرير، وسط البلد',
    notes: 'اتصل قبل التسليم من فضلك',
  }
  const co1 = (await json(await req(guest, 'POST', '/api/checkout', { body: checkoutBody, headers: { 'idempotency-key': idemKey } }))) as any
  await check('POST /api/checkout', !!co1?.orderNumber && typeof co1?.totalCents === 'string', errMsg(co1))

  const co2 = (await json(await req(guest, 'POST', '/api/checkout', { body: checkoutBody, headers: { 'idempotency-key': idemKey } }))) as any
  await check('checkout idempotent replay', !!co1?.orderNumber && co2?.orderNumber === co1.orderNumber, `${co1?.orderNumber} vs ${co2?.orderNumber}`)

  const order = (await json(await req(guest, 'GET', `/api/orders/${co1?.orderNumber}`))) as any
  await check('GET /api/orders/[orderNumber] owner', !!order?.orderNumber && order.isOwner === true && Array.isArray(order.items), errMsg(order))
  await check('order notes persisted', order?.notes === 'اتصل قبل التسليم من فضلك', `notes=${order?.notes}`)

  const cartAfter = (await json(await req(guest, 'GET', '/api/cart'))) as any
  await check('cart cleared after checkout', cartAfter?.items?.length === 0)

  // --- Register ---
  const stamp = Date.now()
  const reg = await req(new CookieJar(), 'POST', '/api/auth/register', {
    body: { email: `smoke+${stamp}@example.com`, password: 'smoke1234', name: 'اختبار دخان', phone: '01112345678' },
  })
  await check('POST /api/auth/register', reg.status === 200 || reg.status === 201, `status ${reg.status}`)

  // --- Admin ---
  const adminLogin = await req(adminJar, 'POST', '/api/auth/login', { body: { email: 'admin@nimbus.app', password: 'admin1234' } })
  await check('admin login', adminLogin.status === 200)

  const stats = (await json(await req(adminJar, 'GET', '/api/admin/stats'))) as any
  await check('GET /api/admin/stats', !!stats && typeof stats === 'object', errMsg(stats))

  const adminProds = (await json(await req(adminJar, 'GET', '/api/admin/products?limit=5'))) as any
  await check('GET /api/admin/products', Array.isArray(adminProds?.items) && adminProds.items.length > 0)

  const adminOrders = (await json(await req(adminJar, 'GET', '/api/admin/orders'))) as any
  await check('GET /api/admin/orders', Array.isArray(adminOrders?.items) && adminOrders.items.some((o: any) => o.orderNumber === co1.orderNumber))

  const adminUsers = (await json(await req(adminJar, 'GET', '/api/admin/users'))) as any
  await check('GET /api/admin/users', Array.isArray(adminUsers?.items) && adminUsers.items.length >= 3)

  const audit = (await json(await req(adminJar, 'GET', '/api/admin/audit'))) as any
  await check('GET /api/admin/audit', Array.isArray(audit?.items))

  const settings = (await json(await req(adminJar, 'GET', '/api/admin/settings'))) as any
  await check('GET /api/admin/settings', !!settings)

  const currencies = (await json(await req(adminJar, 'GET', '/api/admin/currencies'))) as any
  await check('GET /api/admin/currencies', Array.isArray(currencies?.items) && currencies.items.length === 5)

  const hero = (await json(await req(adminJar, 'GET', '/api/admin/hero-slides'))) as any
  await check('GET /api/admin/hero-slides', Array.isArray(hero?.items) && hero.items.length === 3)

  // Admin order status transition
  const statusRes = await req(adminJar, 'PATCH', `/api/admin/orders/${co1?.orderNumber}/status`, { body: { status: 'PROCESSING' } })
  await check('PATCH admin order status→PROCESSING', statusRes.status === 200, `status ${statusRes.status}`)

  // Non-admin blocked from admin API
  const blocked = await req(guest, 'GET', '/api/admin/stats')
  await check('admin API blocked for customer (401/403)', blocked.status === 401 || blocked.status === 403, `status ${blocked.status}`)

  // --- SSR pages (customer jar = logged in) ---
  const pages: Array<[string, number[]]> = [
    ['/', [200]],
    ['/products', [200]],
    [`/products/${firstSlug}`, [200]],
    ['/search?q=قميص', [200]],
    [`/categories/${catItems[0].slug}`, [200]],
    ['/cart', [200]],
    ['/checkout', [200]],
    ['/login', [200]],
    ['/register', [200]],
    ['/wishlist', [200]],
    ['/account', [200]],
    ['/account/orders', [200]],
    ['/nope-404-page', [404]],
  ]
  for (const [path, codes] of pages) {
    const res = await req(guest, 'GET', path)
    await check(`SSR ${path} → ${codes.join('/')}`, codes.includes(res.status), `got ${res.status}`)
  }

  // Protected pages redirect when logged out (fresh anonymous jar)
  for (const path of ['/account', '/account/orders', '/wishlist', '/admin']) {
    const res = await req(anon, 'GET', path)
    const loc = res.headers.get('location') ?? ''
    const redirected = res.status >= 300 && res.status < 400
    await check(`SSR ${path} anon redirects`, redirected, `status ${res.status} loc=${loc}`)
  }

  // Admin page blocked for customer
  const adminPageAsUser = await req(guest, 'GET', '/admin')
  await check('SSR /admin customer blocked', adminPageAsUser.status !== 200, `status ${adminPageAsUser.status}`)

  const adminPage = await req(adminJar, 'GET', '/admin')
  await check('SSR /admin admin 200', adminPage.status === 200, `got ${adminPage.status}`)

  const adminOrdersPage = await req(adminJar, 'GET', '/admin/orders')
  await check('SSR /admin/orders 200', adminOrdersPage.status === 200, `got ${adminOrdersPage.status}`)

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.log('Failures:')
    for (const f of failures) console.log(`  - ${f}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('SMOKE_CRASH', err)
  process.exit(1)
})
