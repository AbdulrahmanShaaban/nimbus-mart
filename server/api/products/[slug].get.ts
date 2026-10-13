import { discountPercentOf, pickDefaultVariantId, toProductCard } from '../../utils/serialize'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 404, statusMessage: 'Not Found' })

  const db = useDb()
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sort: 'asc' } },
      variants: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!product || product.status !== 'ACTIVE') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const related = await db.product.findMany({
    where: { status: 'ACTIVE', categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      category: true,
      images: { orderBy: { sort: 'asc' }, take: 1 },
      variants: { orderBy: { createdAt: 'asc' } },
    },
  })

  return {
    productId: product.id,
    slug: product.slug,
    titleAr: product.titleAr,
    titleEn: product.titleEn,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    priceCents: product.priceCents.toString(),
    compareAtCents: product.compareAtCents?.toString() ?? null,
    discountPercent: discountPercentOf(product.priceCents, product.compareAtCents),
    category: { slug: product.category.slug, nameAr: product.category.nameAr, nameEn: product.category.nameEn },
    images: product.images.map((image) => image.url),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      colorHex: variant.colorHex,
      stock: variant.stock,
      priceCents: variant.priceCents?.toString() ?? null,
      imageUrl: variant.imageUrl,
    })),
    defaultVariantId: pickDefaultVariantId(product.variants),
    related: related.map(toProductCard),
  }
})
