import type { Prisma } from '../../../generated/prisma/client'

function qstr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function qint(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : Number.NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const status = qstr(query.status)
  const q = qstr(query.q)
  const page = qint(query.page, 1, 1, 10_000)
  const limit = qint(query.limit, 20, 1, 100)

  const where: Prisma.OrderWhereInput = {}
  if (
    status === 'PLACED' ||
    status === 'PROCESSING' ||
    status === 'SHIPPED' ||
    status === 'DELIVERED' ||
    status === 'CANCELLED'
  ) {
    where.status = status
  }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ]
  }

  const db = useDb()
  const [total, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        orderNumber: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        totalCents: true,
        governorate: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
  ])

  return {
    items: rows.map((o) => ({
      orderNumber: o.orderNumber,
      name: o.name,
      phone: o.phone,
      email: o.email,
      status: o.status,
      totalCents: o.totalCents.toString(),
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
      governorate: o.governorate,
    })),
    total,
    page,
  }
})
