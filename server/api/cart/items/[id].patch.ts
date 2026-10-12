import { z } from 'zod'
import type { CartActor } from '../../../utils/cart'

const bodySchema = z.object({
  quantity: z.number().int().min(0).max(99),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })

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

  return await updateCartItem(actor, id, parsed.data.quantity)
})
