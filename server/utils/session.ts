import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'nm_session'
export const SID_COOKIE = 'nm_sid'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30

export function ensureGuestSid(event: H3Event): string {
  const existing = getCookie(event, SID_COOKIE)
  if (existing) return existing
  const sid = randomBytes(16).toString('hex')
  setCookie(event, SID_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return sid
}

export function setSessionCookie(event: H3Event, token: string): void {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

export function newSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export async function requireUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const session = await useDb().session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session.user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

export async function optionalUser(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) return null
  const session = await useDb().session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}
