import { describe, expect, it } from 'vitest'
import {
  clampQuantity,
  convertToDisplayMinor,
  formatEgp,
  formatMinor,
  lineTotal,
  orderTotal,
  sumLineTotals,
} from '../shared/utils/money'

describe('clampQuantity', () => {
  it('floors to at least 1', () => {
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-5)).toBe(1)
    expect(clampQuantity(NaN)).toBe(1)
  })

  it('truncates decimals and caps at 99', () => {
    expect(clampQuantity(3.9)).toBe(3)
    expect(clampQuantity(1000)).toBe(99)
  })
})

describe('lineTotal / sumLineTotals / orderTotal', () => {
  it('multiplies in bigint without float drift', () => {
    const price = 199999n
    expect(lineTotal(price, 3)).toBe(599997n)
  })

  it('clamps quantity inside lineTotal', () => {
    expect(lineTotal(100n, 0)).toBe(100n)
  })

  it('sums lines and adds shipping', () => {
    const lines = [{ lineTotalCents: 100n }, { lineTotalCents: 250n }]
    expect(sumLineTotals(lines)).toBe(350n)
    expect(orderTotal(350n, 5000n)).toBe(5350n)
  })
})

describe('convertToDisplayMinor', () => {
  it('identity for rate 1', () => {
    expect(convertToDisplayMinor(12345n, '1')).toBe(12345n)
  })

  it('converts with half-up rounding', () => {
    // 1000 EGP cents * 0.0206 = 20.6 USD cents -> 21
    expect(convertToDisplayMinor(100000n, '0.0206')).toBe(2060n)
    // 1 cent * 0.0206 = 0.0206 -> rounds to 0
    expect(convertToDisplayMinor(1n, '0.0206')).toBe(0n)
    // 150 * 0.0206? use a rate that hits .5 exactly: 10 * 0.05 = 0.5 -> 1
    expect(convertToDisplayMinor(10n, '0.05')).toBe(1n)
  })

  it('rounds to 0 decimals when decimals=0', () => {
    expect(convertToDisplayMinor(1000n, '1', 0)).toBe(1000n)
    expect(convertToDisplayMinor(1550n, '1', 0)).toBe(1600n)
    expect(convertToDisplayMinor(1549n, '1', 0)).toBe(1500n)
  })

  it('applies rounding step (e.g. nearest 100 minor units)', () => {
    expect(convertToDisplayMinor(1000n, '1', 2, 100n)).toBe(1000n)
    expect(convertToDisplayMinor(1049n, '1', 2, 100n)).toBe(1000n)
    expect(convertToDisplayMinor(1050n, '1', 2, 100n)).toBe(1100n)
  })
})

describe('formatMinor / formatEgp', () => {
  it('formats thousands separators', () => {
    expect(formatMinor(1234567n)).toBe('12,345.67')
    expect(formatMinor(0n)).toBe('0.00')
    expect(formatMinor(5n)).toBe('0.05')
    expect(formatMinor(123456n, 0)).toBe('123,456')
  })

  it('formats negative amounts', () => {
    expect(formatMinor(-1234n)).toBe('-12.34')
  })

  it('formats EGP label', () => {
    expect(formatEgp(199999n)).toBe('1,999.99 ج.م')
  })
})
