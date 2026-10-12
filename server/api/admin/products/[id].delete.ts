import { isFkViolation } from './index.post'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'معرّف المنتج غير صالح' })
  }

  const db = useDb()
  const existing = await db.product.findUnique({ where: { id }, select: { id: true, slug: true, titleAr: true } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'المنتج غير موجود' })
  }

  try {
    await db.product.delete({ where: { id } })
  } catch (e) {
    if (isFkViolation(e)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'لا يمكن حذف المنتج لوجود طلبات سابقة تستخدمه',
      })
    }
    throw e
  }

  await writeAudit(event, admin.id, 'DELETE', 'product', id, {
    slug: existing.slug,
    titleAr: existing.titleAr,
  }, null)

  return { ok: true }
})
