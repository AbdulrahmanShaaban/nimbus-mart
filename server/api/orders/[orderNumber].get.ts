export default defineEventHandler(async (event) => {
  const orderNumber = getRouterParam(event, 'orderNumber')
  if (!orderNumber) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const order = await useDb().order.findUnique({
    where: { orderNumber },
    include: { items: { orderBy: { id: 'asc' } } },
  })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const user = await optionalUser(event)
  const isOwner = user !== null && order.userId !== null && order.userId === user.id

  if (isOwner) {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMode: order.paymentMode,
      createdAt: order.createdAt.toISOString(),
      subtotalCents: order.subtotalCents.toString(),
      shippingCents: order.shippingCents.toString(),
      totalCents: order.totalCents.toString(),
      displayCurrencyCode: order.displayCurrencyCode,
      displayTotalMinor: order.displayTotalMinor?.toString() ?? null,
      name: order.name,
      phone: order.phone,
      governorate: order.governorate,
      addressLine: order.addressLine,
      notes: order.notes,
      email: order.email,
      isOwner: true,
      items: order.items.map((item) => ({
        productTitleSnapshot: item.productTitleSnapshot,
        variantSnapshot: item.variantSnapshot,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents.toString(),
        lineTotalCents: item.lineTotalCents.toString(),
        displayUnitPriceMinor: item.displayUnitPriceMinor?.toString() ?? null,
      })),
    }
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    totalCents: order.totalCents.toString(),
    createdAt: order.createdAt.toISOString(),
    isOwner: false,
    items: order.items.map((item) => ({
      productTitleSnapshot: item.productTitleSnapshot,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents.toString(),
    })),
  }
})
