import { normalizeArabic } from '#shared/utils/normalize-ar'
import type { Prisma } from '../../generated/prisma/client'
import { toProductCard } from '../../utils/serialize'

function clampQueryInt(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'string') return fallback
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const category =
    typeof query.category === 'string' && query.category.trim().length > 0 ? query.category.trim() : null
  const rawQ = typeof query.q === 'string' ? query.q.trim() : ''
  const normalizedQ = rawQ.length > 0 ? normalizeArabic(rawQ) : ''
  const sale = query.sale === '1'

  const minEgp = typeof query.min === 'string' && /^\d+$/.test(query.min) ? Number.parseInt(query.min, 10) : null
  const maxEgp = typeof query.max === 'string' && /^\d+$/.test(query.max) ? Number.parseInt(query.max, 10) : null

  const sort = typeof query.sort === 'string' ? query.sort : ''
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price_asc'
      ? { priceCents: 'asc' }
      : sort === 'price_desc'
        ? { priceCents: 'desc' }
        : { createdAt: 'desc' }

  const page = clampQueryInt(query.page, 1, 1, 100_000)
  const pageSize = clampQueryInt(query.limit, 20, 1, 48)

  const where: Prisma.ProductWhereInput = { status: 'ACTIVE' }
  if (category) where.category = { slug: category }
  if (normalizedQ) where.searchNormalized = { contains: normalizedQ }
  if (sale) where.compareAtCents = { not: null }
  if (minEgp !== null || maxEgp !== null) {
    const range: { gte?: bigint, lte?: bigint } = {}
    if (minEgp !== null) range.gte = BigInt(minEgp) * 100n
    if (maxEgp !== null) range.lte = BigInt(maxEgp) * 100n
    where.priceCents = range
  }

  const db = useDb()
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        images: { orderBy: { sort: 'asc' }, take: 1 },
        variants: { orderBy: { createdAt: 'asc' } },
      },
    }),
    db.product.count({ where }),
  ])

  return { items: rows.map(toProductCard), total, page, pageSize }
})
