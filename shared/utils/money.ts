export function clampQuantity(q: number): number {
  const n = Math.trunc(q)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(99, n)
}

export function lineTotal(unitPriceCents: bigint, quantity: number): bigint {
  return unitPriceCents * BigInt(clampQuantity(quantity))
}

export function sumLineTotals(lines: { lineTotalCents: bigint }[]): bigint {
  return lines.reduce((acc, l) => acc + l.lineTotalCents, 0n)
}

export function orderTotal(subtotalCents: bigint, shippingCents: bigint): bigint {
  return subtotalCents + shippingCents
}

function parseRateToScaled(rateStr: string): bigint {
  const cleaned = rateStr.trim()
  const neg = cleaned.startsWith('-')
  const body = neg ? cleaned.slice(1) : cleaned
  const [intPart = '0', fracPart = ''] = body.split('.')
  const fracScaled = (fracPart + '00000000').slice(0, 8)
  const scaled = BigInt(intPart || '0') * 100000000n + BigInt(fracScaled || '0')
  return neg ? -scaled : scaled
}

export function convertToDisplayMinor(
  baseCents: bigint,
  rateStr: string,
  decimals = 2,
  roundingStepCents: bigint | null = null,
): bigint {
  const rateScaled = parseRateToScaled(rateStr)
  const product = baseCents * rateScaled
  const divisor = 100000000n
  let minor = product / divisor
  const rem = product % divisor
  if (rem * 2n >= divisor) minor += 1n
  if (decimals < 2) {
    const factor = 10n ** BigInt(2 - decimals)
    minor = ((minor + factor / 2n) / factor) * factor
  }
  if (roundingStepCents && roundingStepCents > 0n) {
    const step = roundingStepCents
    minor = ((minor + step / 2n) / step) * step
  }
  return minor
}

export function formatMinor(
  minor: bigint,
  decimals = 2,
): string {
  const negative = minor < 0n
  const abs = negative ? -minor : minor
  const s = abs.toString().padStart(decimals + 1, '0')
  const intPart = s.slice(0, s.length - decimals)
  const fracPart = s.slice(s.length - decimals)
  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const body = decimals > 0 ? `${withSeparators}.${fracPart}` : withSeparators
  return negative ? `-${body}` : body
}

export function formatEgp(baseCents: bigint): string {
  return `${formatMinor(baseCents, 2)} ج.م`
}
