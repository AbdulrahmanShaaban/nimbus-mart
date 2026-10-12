export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'معرّف المنتج غير صالح' })
  }

  const product = await useDb().product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sort: 'asc' }, select: { url: true } },
      variants: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          colorHex: true,
          priceCents: true,
          stock: true,
          imageUrl: true,
        },
      },
    },
  })

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'المنتج غير موجود' })
  }

  return {
    id: product.id,
    slug: product.slug,
    titleAr: product.titleAr,
    titleEn: product.titleEn,
    descriptionAr: product.descriptionAr,
    priceCents: product.priceCents.toString(),
    compareAtCents: product.compareAtCents?.toString() ?? null,
    status: product.status,
    categoryId: product.categoryId,
    images: product.images.map((img) => img.url),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      colorHex: v.colorHex,
      priceCents: v.priceCents?.toString() ?? null,
      stock: v.stock,
      imageUrl: v.imageUrl,
    })),
  }
})
