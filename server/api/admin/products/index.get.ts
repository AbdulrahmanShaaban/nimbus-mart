import type { Prisma } from '../../../generated/prisma/client'
import { normalizeArabic } from '#shared/utils/normalize-ar'

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
  const q = qstr(query.q)
  const status = qstr(query.status)
  const page = qint(query.page, 1, 1, 10_000)
  const limit = qint(query.limit, 20, 1, 100)

  const where: Prisma.ProductWhereInput = {}
  if (status === 'DRAFT' || status === 'ACTIVE' || status === 'ARCHIVED') {
    where.status = status
  }
  if (q) {
    const normalized = normalizeArabic(q)
    where.OR = [
      { titleAr: { contains: q, mode: 'insensitive' } },
      { titleEn: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { searchNormalized: { contains: normalized } },
    ]
  }

  const db = useDb()
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { nameAr: true, nameEn: true } },
        images: { orderBy: { sort: 'asc' }, take: 1, select: { url: true } },
        variants: { select: { stock: true } },
      },
    }),
  ])

  return {
    items: rows.map((p) => {
      let stockTotal = 0
      for (const v of p.variants) stockTotal += v.stock
      const first = p.images[0]
      return {
        id: p.id,
        slug: p.slug,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        priceCents: p.priceCents.toString(),
        compareAtCents: p.compareAtCents?.toString() ?? null,
        status: p.status,
        categoryName: p.category.nameAr,
        categoryNameEn: p.category.nameEn,
        image: first?.url ?? null,
        stockTotal,
        variantsCount: p.variants.length,
      }
    }),
    total,
    page,
  }
})
