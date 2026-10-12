import type { Prisma } from '../generated/prisma/client'

export interface CartItemView {
  id: string
  variantId: string
  quantity: number
  unitPriceCents: string
  lineTotalCents: string
  stock: number
  size: string | null
  color: string | null
  colorHex: string | null
  productTitleAr: string
  productSlug: string
  imageUrl: string | null
}

export interface CartView {
  items: CartItemView[]
  subtotalCents: string
  count: number
}

export interface CartActor {
  userId: string | null
  sessionId: string
}

const itemInclude = {
  variant: {
    include: {
      product: {
        include: { images: { orderBy: { sort: 'asc' as const }, take: 1 } },
      },
    },
  },
} satisfies Prisma.CartItemInclude

function actorWhere(actor: CartActor): Prisma.CartItemWhereInput {
  return actor.userId ? { userId: actor.userId } : { sessionId: actor.sessionId }
}

export function toCartView(
  rows: {
    id: string
    quantity: number
    variant: {
      id: string
      stock: number
      size: string | null
      color: string | null
      colorHex: string | null
      priceCents: bigint | null
      imageUrl: string | null
      product: { titleAr: string; slug: string; priceCents: bigint; images: { url: string }[] }
    }
  }[],
): CartView {
  let subtotal = 0n
  const items: CartItemView[] = rows.map((row) => {
    const unit = row.variant.priceCents ?? row.variant.product.priceCents
    const qty = Math.min(Math.max(1, Math.trunc(row.quantity)), 99)
    const line = unit * BigInt(qty)
    subtotal += line
    return {
      id: row.id,
      variantId: row.variant.id,
      quantity: qty,
      unitPriceCents: unit.toString(),
      lineTotalCents: line.toString(),
      stock: row.variant.stock,
      size: row.variant.size,
      color: row.variant.color,
      colorHex: row.variant.colorHex,
      productTitleAr: row.variant.product.titleAr,
      productSlug: row.variant.product.slug,
      imageUrl: row.variant.imageUrl ?? row.variant.product.images[0]?.url ?? null,
    }
  })
  return { items, subtotalCents: subtotal.toString(), count: items.length }
}

export async function getCartView(actor: CartActor): Promise<CartView> {
  const rows = await useDb().cartItem.findMany({
    where: actorWhere(actor),
    include: itemInclude,
    orderBy: { createdAt: 'asc' },
  })
  return toCartView(rows)
}

export async function addToCart(
  actor: CartActor,
  variantId: string,
  quantity: number,
): Promise<CartView> {
  const db = useDb()
  const variant = await db.variant.findUnique({ where: { id: variantId } })
  if (!variant) throw createError({ statusCode: 404, statusMessage: 'Variant not found' })
  if (variant.stock < 1) {
    throw createError({ statusCode: 400, statusMessage: 'OUT_OF_STOCK' })
  }

  const requested = Math.min(Math.max(1, Math.trunc(quantity)), 99)
  const key = actor.userId
    ? ({ userId_variantId: { userId: actor.userId, variantId } } as const)
    : ({ sessionId_variantId: { sessionId: actor.sessionId, variantId } } as const)

  const existing = await db.cartItem.findUnique({ where: key })
  const nextQty = Math.min((existing?.quantity ?? 0) + requested, 99, variant.stock)

  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } })
  } else {
    try {
      await db.cartItem.create({
        data: {
          variantId,
          userId: actor.userId,
          sessionId: actor.userId ? null : actor.sessionId,
          quantity: Math.min(requested, variant.stock),
        },
      })
    } catch (e) {
      // concurrent add hit the compound unique — retry as an update
      if (isUniqueViolation(e)) {
        const row = await db.cartItem.findUnique({ where: key })
        if (row) {
          await db.cartItem.update({
            where: { id: row.id },
            data: { quantity: Math.min(row.quantity + requested, 99, variant.stock) },
          })
        } else {
          throw e
        }
      } else {
        throw e
      }
    }
  }
  return getCartView(actor)
}

export async function updateCartItem(
  actor: CartActor,
  id: string,
  quantity: number,
): Promise<CartView> {
  const db = useDb()
  const row = await db.cartItem.findUnique({ where: { id }, include: itemInclude })
  if (!row || !owns(row, actor)) {
    throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })
  }
  const qty = Math.trunc(quantity)
  if (qty < 1) {
    await db.cartItem.delete({ where: { id: row.id } })
    return getCartView(actor)
  }
  const capped = Math.min(qty, 99, row.variant.stock)
  await db.cartItem.update({ where: { id: row.id }, data: { quantity: capped } })
  return getCartView(actor)
}

export async function removeCartItem(actor: CartActor, id: string): Promise<CartView> {
  const db = useDb()
  const row = await db.cartItem.findUnique({ where: { id } })
  if (!row || !owns(row, actor)) {
    throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })
  }
  await db.cartItem.delete({ where: { id } })
  return getCartView(actor)
}

export async function clearCartFor(actor: CartActor): Promise<void> {
  await useDb().cartItem.deleteMany({ where: actorWhere(actor) })
}

export async function mergeGuestCart(sessionId: string, userId: string): Promise<void> {
  const db = useDb()
  const guestRows = await db.cartItem.findMany({ where: { sessionId, userId: null } })
  for (const row of guestRows) {
    const existing = await db.cartItem.findUnique({
      where: { userId_variantId: { userId, variantId: row.variantId } },
    })
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + row.quantity, 99) },
      })
      await db.cartItem.delete({ where: { id: row.id } })
    } else {
      await db.cartItem.update({
        where: { id: row.id },
        data: { userId, sessionId: null },
      })
    }
  }
}

function owns(row: { userId: string | null; sessionId: string | null }, actor: CartActor): boolean {
  if (actor.userId) return row.userId === actor.userId
  return row.userId === null && row.sessionId === actor.sessionId
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: string }).code === 'P2002'
  )
}
