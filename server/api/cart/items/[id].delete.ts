import type { CartActor } from '../../../utils/cart'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 404, statusMessage: 'Cart item not found' })

  const user = await optionalUser(event)
  const sid = ensureGuestSid(event)
  const actor: CartActor = { userId: user?.id ?? null, sessionId: sid }

  return await removeCartItem(actor, id)
})
