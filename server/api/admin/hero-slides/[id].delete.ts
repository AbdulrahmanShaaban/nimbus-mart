export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'معرّف الشريحة غير صالح' })
  }

  const db = useDb()
  const existing = await db.heroSlide.findUnique({ where: { id }, select: { titleAr: true } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'الشريحة غير موجودة' })
  }

  await db.heroSlide.delete({ where: { id } })
  await writeAudit(event, admin.id, 'DELETE', 'hero_slide', id, { titleAr: existing.titleAr }, null)

  return { ok: true }
})
