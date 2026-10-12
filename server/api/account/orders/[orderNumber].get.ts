interface OrderDetailItem {
  productTitleSnapshot: string
  variantSnapshot: string
  quantity: number
  unitPriceCents: string
  lineTotalCents: string
  displayUnitPriceMinor: string | null
}

interface OrderDetailResponse {
  orderNumber: string
  createdAt: string
  status: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentMode: 'DEMO'
  subtotalCents: string
  shippingCents: string
  totalCents: string
  displayCurrencyCode: string
  displayTotalMinor: string | null
  name: string
  phone: string
  governorate: string
  addressLine: string
  notes: string | null
  items: OrderDetailItem[]
}

export default defineEventHandler(async (event): Promise<OrderDetailResponse> => {
  const user = await requireUser(event)
  const orderNumber = getRouterParam(event, 'orderNumber')
  if (!orderNumber) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const order = await useDb().order.findUnique({
    where: { orderNumber },
    include: { items: true },
  })
  if (!order || order.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    paymentMode: order.paymentMode,
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
    items: order.items.map((item) => ({
      productTitleSnapshot: item.productTitleSnapshot,
      variantSnapshot: item.variantSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents.toString(),
      lineTotalCents: item.lineTotalCents.toString(),
      displayUnitPriceMinor: item.displayUnitPriceMinor?.toString() ?? null,
    })),
  }
})
