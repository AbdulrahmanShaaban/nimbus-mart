import { z } from 'zod'
import type { CartActor } from '../../utils/cart'

const bodySchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
})

export default defineEventHandler(async (event) => {
  const raw: unknown = await readBody(event)
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION_ERROR',
      message: parsed.error.issues[0]?.message ?? 'Invalid body',
    })
  }

  const user = await optionalUser(event)
  const sid = ensureGuestSid(event)
  const actor: CartActor = { userId: user?.id ?? null, sessionId: sid }

  return await addToCart(actor, parsed.data.variantId, parsed.data.quantity)
})
