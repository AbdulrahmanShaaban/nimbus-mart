import { toCategoryCard } from '../../utils/serialize'

export default defineEventHandler(async () => {
  const rows = await useDb().category.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: { where: { status: 'ACTIVE' } } } },
      products: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        take: 5,
        include: { images: { orderBy: { sort: 'asc' }, take: 1 } },
      },
    },
  })

  return { items: rows.map(toCategoryCard) }
})
