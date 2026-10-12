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
  const role = qstr(query.role)
  const q = qstr(query.q)
  const page = qint(query.page, 1, 1, 10_000)
  const limit = qint(query.limit, 20, 1, 100)

  const where: Prisma.UserWhereInput = {}
  if (role === 'CUSTOMER' || role === 'ADMIN') {
    where.role = role
  }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ]
  }

  const db = useDb()
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ])

  return {
    items: rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      ordersCount: u._count.orders,
    })),
    total,
    page,
  }
})
