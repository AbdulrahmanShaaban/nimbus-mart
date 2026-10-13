import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9334
const BASE = 'http://localhost:3001'
const OUT = 'design/shots'

mkdirSync(OUT, { recursive: true })

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${join(tmpdir(), 'nm-i18n-chrome2')}`,
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore', detached: false })

async function getWsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = await res.json()
      const page = targets.find((t) => t.type === 'page')
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome CDP not ready')
}

const ws = new WebSocket(await getWsUrl())
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let msgId = 0
const pending = new Map()
ws.onmessage = (ev) => {
  const data = JSON.parse(ev.data)
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id)
    pending.delete(data.id)
    if (data.error) reject(new Error(data.error.message))
    else resolve(data.result)
  }
}
function send(method, params = {}) {
  const id = ++msgId
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function nav(url, waitMs = 2200) {
  await send('Page.navigate', { url })
  await sleep(waitMs)
}
async function evalJs(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return r.result?.value
}
async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
  console.log(`shot: ${name}`)
}
async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 800,
  })
}
async function setLocaleCookie(locale) {
  await send('Network.setCookie', { name: 'nm_locale', value: locale, url: BASE })
}
async function clearLocaleCookie() {
  await send('Network.deleteCookies', { name: 'nm_locale', url: BASE })
}

const results = []
async function check(label) {
  const raw = await evalJs(`(() => {
    const h = document.documentElement
    const leaks = [...document.querySelectorAll('h1,h2,h3,p,span,a,button,label,td,th,option')]
      .filter(el => /^(common|header|footer|status|nav|error|pc|pb|cd|pr|home|products|product|category|cart|checkout|account|login|register|wishlist|search|dashboard|orders|users|currencies|audit|productForm|admin)\\.[a-zA-Z0-9.]+$/.test((el.textContent||'').trim()))
      .map(el => (el.textContent||'').trim())
    const switchBtn = document.querySelector('button[aria-label*="تغيير اللغة"], button[aria-label*="Switch language"]')
    return JSON.stringify({
      lang: h.lang, dir: h.dir,
      title: document.title,
      leaks,
      switchAria: switchBtn?.getAttribute('aria-label') || null,
      switchVisible: switchBtn ? switchBtn.offsetWidth > 0 : false,
    })
  })()`)
  const info = JSON.parse(raw)
  results.push({ label, ...info })
  console.log(label, JSON.stringify({ lang: info.lang, dir: info.dir, title: info.title, leaks: info.leaks.length, switchVisible: info.switchVisible }))
}
async function clickSwitch() {
  const r = await evalJs(`(() => {
    const btns = [...document.querySelectorAll('button')]
    const b = btns.find(x => {
      const aria = x.getAttribute('aria-label') || ''
      return /تغيير اللغة|Switch language/.test(aria) && x.offsetWidth > 0
    })
    if (b) { b.click(); return 'clicked' }
    return 'not-found'
  })()`)
  await sleep(2000)
  return r
}

await send('Page.enable')
await send('Network.enable')

// ---- AR desktop (cookie pinned, Accept-Language ar) ----
await setViewport(1440, 900)
await send('Network.setExtraHTTPHeaders', { headers: { 'Accept-Language': 'ar-EG,ar;q=0.9' } })
await setLocaleCookie('ar')
await nav(`${BASE}/`)
await check('home-ar-1440')
await screenshot('i18n-home-ar-1440')

// ---- AR mobile ----
await setViewport(390, 844)
await sleep(500)
await check('home-ar-390')
await screenshot('i18n-home-ar-390')

// ---- Switch to EN on mobile ----
console.log('switch-m:', await clickSwitch())
await check('home-en-390-after-switch')
await screenshot('i18n-home-en-390')

// ---- EN desktop (persisted) ----
await setViewport(1440, 900)
await nav(`${BASE}/`)
await check('home-en-1440')
await screenshot('i18n-home-en-1440')

// ---- EN products ----
await nav(`${BASE}/products`)
await check('products-en-1440')
await screenshot('i18n-products-en-1440')

// ---- Switch back to AR ----
console.log('switch-back:', await clickSwitch())
await check('products-ar-1440')
await screenshot('i18n-products-ar-1440')

// ---- EN login ----
await setLocaleCookie('en')
await nav(`${BASE}/login`)
await check('login-en-1440')
await screenshot('i18n-login-en-1440')

// ---- EN cart empty ----
await nav(`${BASE}/cart`)
await check('cart-en-1440')
await screenshot('i18n-cart-en-1440')

// ---- EN 404 ----
await nav(`${BASE}/products/does-not-exist`)
await check('404-en-1440')
await screenshot('i18n-404-en-1440')

console.log('RESULTS', JSON.stringify(results, null, 2))
const failed = results.filter(r => r.leaks.length > 0)
console.log(failed.length === 0 ? 'NO KEY LEAKS' : `LEAKS: ${JSON.stringify(failed)}`)
ws.close()
chrome.kill()
process.exit(failed.length > 0 ? 1 : 0)
