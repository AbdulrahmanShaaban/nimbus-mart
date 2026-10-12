export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await useDb().session.deleteMany({ where: { token } })
  }
  clearSessionCookie(event)
  return { ok: true as const }
})
