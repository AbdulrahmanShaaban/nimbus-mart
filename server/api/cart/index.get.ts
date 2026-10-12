import type { CartActor } from '../../utils/cart'

export default defineEventHandler(async (event) => {
  const user = await optionalUser(event)
  const sid = ensureGuestSid(event)
  const actor: CartActor = { userId: user?.id ?? null, sessionId: sid }

  return await getCartView(actor)
})
