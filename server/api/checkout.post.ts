import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { clampQuantity, convertToDisplayMinor, lineTotal, orderTotal, sumLineTotals } from '#shared/utils/money'
import type { CartActor } from '../utils/cart'

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2),
  phone: z.string().regex(/^01[0-5]\d{8}$/, 'VALID_PHONE'),
  governorate: z.string().trim().min(2),
  addressLine: z.string().trim().min(5),
  notes: z.string().max(500).optional(),
})

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  )
}

export default defineEventHandler(async (event) => {
  const rawKey = getHeader(event, 'idempotency-key')
  const idempotencyKey = typeof rawKey === 'string' ? rawKey.trim() : ''
  if (!idempotencyKey) {
    throw createError({ statusCode: 400, statusMessage: 'MISSING_IDEMPOTENCY_KEY' })
  }
  if (idempotencyKey.length > 128) {
    throw createError({ statusCode: 400, statusMessage: 'INVALID_IDEMPOTENCY_KEY' })
  }

  const raw: unknown = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Invalid body',
    })
  }
  const body = parsed.data

  const user = await optionalUser(event)
  const sid = ensureGuestSid(event)
  const actor: CartActor = { userId: user?.id ?? null, sessionId: sid }

  const db = useDb()

  const replay = await db.order.findUnique({ where: { idempotencyKey } })
  if (replay) {
    return { orderNumber: replay.orderNumber, totalCents: replay.totalCents.toString() }
  }

  const rows = await db.cartItem.findMany({
    where: actor.userId ? { userId: actor.userId } : { userId: null, sessionId: actor.sessionId },
    include: { variant: { include: { product: true } } },
    orderBy: { createdAt: 'asc' },
  })
  if (rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'EMPTY_CART' })
  }

  const lines = rows.map((row) => {
    const unit = row.variant.priceCents ?? row.variant.product.priceCents
    const qty = clampQuantity(row.quantity)
    return { row, unit, qty, lineTotalCents: lineTotal(unit, qty) }
  })

  const outOfStock = lines.find((line) => line.row.variant.stock < line.qty)
  if (outOfStock) {
    throw createError({
      statusCode: 409,
      statusMessage: 'OUT_OF_STOCK',
      message: outOfStock.row.variant.product.titleAr,
    })
  }

  const subtotalCents = sumLineTotals(lines)
  const shippingCents = 0n
  const totalCents = orderTotal(subtotalCents, shippingCents)

  const displayCode = getCookie(event, 'nm_currency') || 'EGP'
  let rateRow = await db.currencyRate.findUnique({ where: { code: displayCode } })
  if (!rateRow || !rateRow.enabled) {
    rateRow = await db.currencyRate.findFirst({ where: { isBase: true } })
  }
  const rateStr = rateRow ? rateRow.rate.toString() : '1'
  const decimals = rateRow ? rateRow.decimals : 2
  const roundingStepCents = rateRow ? rateRow.roundingStepCents : null
  const displayCurrencyCode = rateRow ? rateRow.code : 'EGP'
  const displaySubtotalMinor = convertToDisplayMinor(subtotalCents, rateStr, decimals, roundingStepCents)
  const displayTotalMinor = convertToDisplayMinor(totalCents, rateStr, decimals, roundingStepCents)

  const orderNumber = `NM-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`

  try {
    const order = await db.$transaction(async (tx) => {
      for (const line of lines) {
        const guarded = await tx.variant.updateMany({
          where: { id: line.row.variantId, stock: { gte: line.qty } },
          data: { stock: { decrement: line.qty } },
        })
        if (guarded.count === 0) {
          throw createError({
            statusCode: 409,
            statusMessage: 'OUT_OF_STOCK',
            message: line.row.variant.product.titleAr,
          })
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          email: body.email,
          name: body.name,
          phone: body.phone,
          governorate: body.governorate,
          addressLine: body.addressLine,
          notes: body.notes?.trim() ? body.notes.trim() : null,
          subtotalCents,
          shippingCents,
          totalCents,
          displayCurrencyCode,
          fxRate: rateStr,
          displaySubtotalMinor,
          displayTotalMinor,
          idempotencyKey,
          items: {
            create: lines.map((line) => ({
              variantId: line.row.variantId,
              productTitleSnapshot: line.row.variant.product.titleAr,
              variantSnapshot:
                [line.row.variant.size, line.row.variant.color].filter(Boolean).join(' / ') ||
                line.row.variant.sku,
              unitPriceCents: line.unit,
              quantity: line.qty,
              lineTotalCents: line.lineTotalCents,
              displayUnitPriceMinor: convertToDisplayMinor(line.unit, rateStr, decimals, roundingStepCents),
            })),
          },
        },
      })

      await tx.cartItem.deleteMany({
        where: actor.userId ? { userId: actor.userId } : { userId: null, sessionId: actor.sessionId },
      })

      return created
    })

    return { orderNumber: order.orderNumber, totalCents: order.totalCents.toString() }
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await db.order.findUnique({ where: { idempotencyKey } })
      if (existing) {
        return { orderNumber: existing.orderNumber, totalCents: existing.totalCents.toString() }
      }
    }
    throw error
  }
})
