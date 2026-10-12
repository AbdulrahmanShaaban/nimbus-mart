import { z } from 'zod'

const bodySchema = z.object({
  productId: z.string().min(1),
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
  const user = await requireUser(event)

  const raw: unknown = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Invalid body',
    })
  }

  const db = useDb()
  const { productId } = parsed.data
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } })
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const key = { userId_productId: { userId: user.id, productId } } as const
  const existing = await db.wishlist.findUnique({ where: key })
  if (existing) {
    await db.wishlist.delete({ where: key })
    return { inWishlist: false }
  }

  try {
    await db.wishlist.create({ data: { userId: user.id, productId } })
  } catch (error) {
    if (isUniqueViolation(error)) return { inWishlist: true }
    throw error
  }
  return { inWishlist: true }
})
