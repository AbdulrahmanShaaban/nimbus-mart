export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  const [products, orders, customers, revenueRows, lowStock, lowStockRows, recentOrders] =
    await Promise.all([
      db.product.count(),
      db.order.count(),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.order.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { totalCents: true },
      }),
      db.variant.count({ where: { stock: { lte: 3 } } }),
      db.variant.findMany({
        where: { stock: { lte: 3 } },
        orderBy: { stock: 'asc' },
        take: 5,
        select: { sku: true, stock: true, product: { select: { titleAr: true } } },
      }),
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          orderNumber: true,
          name: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

  let revenue = 0n
  for (const row of revenueRows) revenue += row.totalCents

  return {
    products,
    orders,
    customers,
    revenueCents: revenue.toString(),
    lowStock,
    lowStockItems: lowStockRows.map((v) => ({
      sku: v.sku,
      titleAr: v.product.titleAr,
      stock: v.stock,
    })),
    recentOrders: recentOrders.map((o) => ({
      orderNumber: o.orderNumber,
      name: o.name,
      totalCents: o.totalCents.toString(),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  }
})
