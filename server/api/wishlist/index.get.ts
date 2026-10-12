import { toProductCard } from '../../utils/serialize'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const rows = await useDb().wishlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: { sort: 'asc' }, take: 1 },
          variants: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  })

  return { items: rows.map((row) => toProductCard(row.product)) }
})
