import type { Prisma } from '../../generated/prisma/client'
import { toCategoryCard, toProductCard } from '../../utils/serialize'

const FEATURED_CATEGORY_SLUGS = ['mens-shirts', 'electronics', 'laptops', 'womens-dresses']

const productCardInclude = {
  category: true,
  images: { orderBy: { sort: 'asc' as const }, take: 1 },
  variants: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ProductInclude

export default defineEventHandler(async () => {
  const db = useDb()

  const [slides, settings, categories, featured, newest, sale, topSales] = await Promise.all([
    db.heroSlide.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
    db.siteSetting.findUnique({ where: { key: 'default' } }),
    db.category.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      take: 10,
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE' } } } },
        products: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          take: 5,
          include: { images: { orderBy: { sort: 'asc' }, take: 1 } },
        },
      },
    }),
    db.product.findMany({
      where: { status: 'ACTIVE', category: { slug: { in: FEATURED_CATEGORY_SLUGS } } },
      orderBy: [{ categoryId: 'asc' }, { createdAt: 'asc' }],
      take: 8,
      include: productCardInclude,
    }),
    db.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: productCardInclude,
    }),
    db.product.findMany({
      where: { status: 'ACTIVE', compareAtCents: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: productCardInclude,
    }),
    db.orderItem.groupBy({
      by: ['variantId'],
      _sum: { quantity: true },
      where: { order: { status: { in: ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    }),
  ])

  const variantIds = topSales.map(row => row.variantId)
  const variants = variantIds.length > 0
    ? await db.variant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true },
      })
    : []
  const variantToProduct = new Map(variants.map(v => [v.id, v.productId]))
  const soldByProduct = new Map<string, number>()
  for (const row of topSales) {
    const productId = variantToProduct.get(row.variantId)
    if (!productId) continue
    soldByProduct.set(productId, (soldByProduct.get(productId) ?? 0) + (row._sum.quantity ?? 0))
  }
  const rankedProductIds = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([productId]) => productId)
    .slice(0, 8)
  const bestProducts = rankedProductIds.length > 0
    ? await db.product.findMany({
        where: { id: { in: rankedProductIds }, status: 'ACTIVE' },
        include: productCardInclude,
      })
    : []
  const rank = new Map(rankedProductIds.map((id, index) => [id, index]))
  bestProducts.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
  const bestSellers = bestProducts.length > 0 ? bestProducts : featured

  return {
    heroSlides: slides.map((slide) => ({
      id: slide.id,
      titleAr: slide.titleAr,
      titleEn: slide.titleEn,
      subtitleAr: slide.subtitleAr,
      subtitleEn: slide.subtitleEn,
      ctaLabelAr: slide.ctaLabelAr,
      ctaLabelEn: slide.ctaLabelEn,
      ctaHref: slide.ctaHref,
      imageUrl: slide.imageUrl,
      bgStyle: slide.bgStyle,
    })),
    categories: categories.map(toCategoryCard),
    featured: featured.map(toProductCard),
    newest: newest.map(toProductCard),
    bestSellers: bestSellers.map(toProductCard),
    sale: sale.map(toProductCard),
    promo: settings && settings.promoHeadingAr
      ? {
          headingAr: settings.promoHeadingAr,
          headingEn: settings.promoHeadingEn,
          bodyAr: settings.promoBodyAr,
          bodyEn: settings.promoBodyEn,
          ctaLabelAr: settings.promoCtaLabelAr,
          ctaLabelEn: settings.promoCtaLabelEn,
          ctaHref: settings.promoCtaHref,
          gradient: settings.promoGradient,
          imageUrl: settings.promoImageUrl,
        }
      : null,
    promoSecond: settings && settings.promoSecondHeadingAr
      ? {
          headingAr: settings.promoSecondHeadingAr,
          headingEn: settings.promoSecondHeadingEn,
          bodyAr: settings.promoSecondBodyAr,
          bodyEn: settings.promoSecondBodyEn,
          ctaLabelAr: settings.promoSecondCtaLabelAr,
          ctaLabelEn: settings.promoSecondCtaLabelEn,
          ctaHref: settings.promoSecondCtaHref,
          gradient: settings.promoSecondGradient,
          imageUrl: settings.promoSecondImageUrl,
        }
      : null,
    footerBlurbAr: settings?.footerBlurbAr ?? null,
    footerBlurbEn: settings?.footerBlurbEn ?? null,
  }
})
