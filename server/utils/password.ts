import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const saltHex = parts[1]
  const hashHex = parts[2]
  if (!saltHex || !hashHex) return false
  if (!/^[0-9a-fA-F]+$/.test(saltHex) || !/^[0-9a-fA-F]+$/.test(hashHex)) return false
  if (hashHex.length % 2 !== 0) return false
  const expected = Buffer.from(hashHex, 'hex')
  if (expected.length === 0) return false
  const actual = scryptSync(password, saltHex, 64)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
