interface OrderListItem {
  orderNumber: string
  createdAt: string
  status: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalCents: string
  itemCount: number
}

interface OrderListResponse {
  items: OrderListItem[]
  total: number
  page: number
}

export default defineEventHandler(async (event): Promise<OrderListResponse> => {
  const user = await requireUser(event)
  const query = getQuery(event)

  const page = Math.max(1, Math.trunc(Number(query.page) || 1))
  const limit = Math.min(50, Math.max(1, Math.trunc(Number(query.limit) || 10)))

  const db = useDb()
  const where = { userId: user.id }
  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
  ])

  return {
    items: orders.map((order) => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      totalCents: order.totalCents.toString(),
      itemCount: order._count.items,
    })),
    total,
    page,
  }
})
