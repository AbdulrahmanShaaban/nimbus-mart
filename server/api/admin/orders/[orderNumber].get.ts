export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const orderNumber = getRouterParam(event, 'orderNumber')
  if (!orderNumber) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'رقم الطلب غير صالح' })
  }

  const order = await useDb().order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { email: true, name: true } },
      items: {
        select: {
          productTitleSnapshot: true,
          variantSnapshot: true,
          quantity: true,
          unitPriceCents: true,
          lineTotalCents: true,
        },
      },
    },
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'الطلب غير موجود' })
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMode: order.paymentMode,
    email: order.email,
    name: order.name,
    phone: order.phone,
    governorate: order.governorate,
    addressLine: order.addressLine,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    subtotalCents: order.subtotalCents.toString(),
    shippingCents: order.shippingCents.toString(),
    totalCents: order.totalCents.toString(),
    displayCurrencyCode: order.displayCurrencyCode,
    user: order.user ? { email: order.user.email, name: order.user.name } : null,
    items: order.items.map((i) => ({
      productTitleSnapshot: i.productTitleSnapshot,
      variantSnapshot: i.variantSnapshot,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents.toString(),
      lineTotalCents: i.lineTotalCents.toString(),
    })),
  }
})
