import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const orderNumber = getRouterParam(event, 'orderNumber')
  if (!orderNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'رقم الطلب غير صالح' })
  }

  const body = await readBody(event)
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'حالة الطلب غير صالحة',
    })
  }

  const db = useDb()
  const order = await db.order.findUnique({
    where: { orderNumber },
    select: { id: true, status: true },
  })
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'الطلب غير موجود' })
  }

  const beforeStatus = order.status
  const nextStatus = parsed.data.status

  await db.order.update({ where: { id: order.id }, data: { status: nextStatus } })
  await writeAudit(event, admin.id, 'UPDATE', 'order', order.id, { status: beforeStatus }, { status: nextStatus })

  return { ok: true, status: nextStatus }
})
