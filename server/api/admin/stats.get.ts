const STATUS_ORDER = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

const DAY_MS = 86_400_000

const cairoDayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function lastCairoDays(count: number): string[] {
  const parts = cairoDayFormat.format(new Date()).split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const days: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(cairoDayFormat.format(new Date(Date.UTC(year, month - 1, day - offset))))
  }
  return days
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()

  const now = Date.now()
  const currentWindowStart = new Date(now - 30 * DAY_MS)
  const previousWindowStart = new Date(now - 60 * DAY_MS)

  const [
    products,
    orders,
    customers,
    revenueRows,
    lowStock,
    lowStockRows,
    recentOrders,
    revenueCurrent,
    revenuePrevious,
    ordersCurrent,
    ordersPrevious,
    customersCurrent,
    customersPrevious,
    dailyRows,
    statusGroups,
    topVariantGroups,
  ] = await Promise.all([
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
      select: { sku: true, stock: true, product: { select: { titleAr: true, titleEn: true } } },
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
    db.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { not: 'CANCELLED' }, createdAt: { gte: currentWindowStart } },
    }),
    db.order.aggregate({
      _sum: { totalCents: true },
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: previousWindowStart, lt: currentWindowStart },
      },
    }),
    db.order.count({ where: { createdAt: { gte: currentWindowStart } } }),
    db.order.count({ where: { createdAt: { gte: previousWindowStart, lt: currentWindowStart } } }),
    db.user.count({ where: { createdAt: { gte: currentWindowStart } } }),
    db.user.count({ where: { createdAt: { gte: previousWindowStart, lt: currentWindowStart } } }),
    db.$queryRaw<{ day: string; revenue: bigint; order_count: bigint }[]>`
      SELECT to_char(date_trunc('day', "created_at" AT TIME ZONE 'Africa/Cairo'), 'YYYY-MM-DD') AS day,
             COALESCE(SUM("total_cents") FILTER (WHERE status <> 'CANCELLED'), 0)::bigint AS revenue,
             COUNT(*)::bigint AS order_count
      FROM orders
      WHERE "created_at" >= now() - interval '31 days'
      GROUP BY 1 ORDER BY 1
    `,
    db.order.groupBy({ by: ['status'], _count: { _all: true } }),
    db.orderItem.groupBy({
      by: ['variantId'],
      where: { order: { createdAt: { gte: currentWindowStart }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true, lineTotalCents: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    }),
  ])

  let revenue = BigInt(0)
  for (const row of revenueRows) revenue += row.totalCents

  const dailyByDay = new Map<string, { day: string; revenue: bigint; order_count: bigint }>()
  for (const row of dailyRows) dailyByDay.set(row.day, row)
  const daily = lastCairoDays(30).map((day) => {
    const row = dailyByDay.get(day)
    return {
      day,
      revenueCents: (row?.revenue ?? BigInt(0)).toString(),
      orders: Number(row?.order_count ?? BigInt(0)),
    }
  })

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: statusGroups.find((group) => group.status === status)?._count._all ?? 0,
  }))

  const topVariantIds = topVariantGroups.map((row) => row.variantId)
  const topVariants =
    topVariantIds.length > 0
      ? await db.variant.findMany({
          where: { id: { in: topVariantIds } },
          select: { id: true, productId: true },
        })
      : []
  const variantToProduct = new Map<string, string>()
  for (const variant of topVariants) variantToProduct.set(variant.id, variant.productId)

  const totalsByProduct = new Map<string, { units: number; revenueCents: bigint }>()
  for (const row of topVariantGroups) {
    const productId = variantToProduct.get(row.variantId)
    if (!productId) continue
    const total = totalsByProduct.get(productId) ?? { units: 0, revenueCents: BigInt(0) }
    total.units += row._sum.quantity ?? 0
    total.revenueCents += row._sum.lineTotalCents ?? BigInt(0)
    totalsByProduct.set(productId, total)
  }

  const rankedProductIds = [...totalsByProduct.entries()]
    .sort((a, b) => {
      if (b[1].units !== a[1].units) return b[1].units - a[1].units
      if (b[1].revenueCents !== a[1].revenueCents) return b[1].revenueCents > a[1].revenueCents ? 1 : -1
      return 0
    })
    .slice(0, 5)
    .map(([productId]) => productId)

  const rankedProducts =
    rankedProductIds.length > 0
      ? await db.product.findMany({
          where: { id: { in: rankedProductIds } },
          select: { id: true, slug: true, titleAr: true, titleEn: true },
        })
      : []
  const productById = new Map<string, { id: string; slug: string; titleAr: string; titleEn: string | null }>()
  for (const product of rankedProducts) productById.set(product.id, product)

  const topProducts = rankedProductIds.flatMap((productId) => {
    const product = productById.get(productId)
    const total = totalsByProduct.get(productId)
    if (!product || !total) return []
    return [
      {
        productId: product.id,
        slug: product.slug,
        titleAr: product.titleAr,
        titleEn: product.titleEn,
        units: total.units,
        revenueCents: total.revenueCents.toString(),
      },
    ]
  })

  return {
    products,
    orders,
    customers,
    revenueCents: revenue.toString(),
    lowStock,
    lowStockItems: lowStockRows.map((v) => ({
      sku: v.sku,
      titleAr: v.product.titleAr,
      titleEn: v.product.titleEn,
      stock: v.stock,
    })),
    recentOrders: recentOrders.map((o) => ({
      orderNumber: o.orderNumber,
      name: o.name,
      totalCents: o.totalCents.toString(),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    kpi: {
      revenue30: {
        cents: (revenueCurrent._sum.totalCents ?? BigInt(0)).toString(),
        prevCents: (revenuePrevious._sum.totalCents ?? BigInt(0)).toString(),
      },
      orders30: { count: ordersCurrent, prevCount: ordersPrevious },
      customers30: { count: customersCurrent, prevCount: customersPrevious },
    },
    daily,
    statusCounts,
    topProducts,
  }
})
