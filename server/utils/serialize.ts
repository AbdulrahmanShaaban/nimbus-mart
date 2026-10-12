export interface ProductCard {
  productId: string
  slug: string
  titleAr: string
  titleEn: string | null
  priceCents: string
  compareAtCents: string | null
  image: string | null
  categorySlug: string
  categoryNameAr: string
  defaultVariantId: string | null
  discountPercent: number | null
}

export interface ProductCardRow {
  id: string
  slug: string
  titleAr: string
  titleEn: string | null
  priceCents: bigint
  compareAtCents: bigint | null
  category: { slug: string; nameAr: string }
  images: { url: string }[]
  variants: { id: string; stock: number }[]
}

export interface CategoryCard {
  slug: string
  nameAr: string
  nameEn: string | null
  icon: string
  productCount: number
  image: string | null
}

export interface CategoryCardRow {
  slug: string
  nameAr: string
  nameEn: string | null
  icon: string
  _count: { products: number }
  products: { images: { url: string }[] }[]
}

export function discountPercentOf(priceCents: bigint, compareAtCents: bigint | null): number | null {
  if (compareAtCents === null || compareAtCents <= priceCents) return null
  return Math.round((Number(compareAtCents - priceCents) / Number(compareAtCents)) * 100)
}

export function pickDefaultVariantId(variants: { id: string; stock: number }[]): string | null {
  const first = variants[0]
  if (!first) return null
  const inStock = variants.find((variant) => variant.stock > 0)
  return (inStock ?? first).id
}

export function toProductCard(row: ProductCardRow): ProductCard {
  return {
    productId: row.id,
    slug: row.slug,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    priceCents: row.priceCents.toString(),
    compareAtCents: row.compareAtCents?.toString() ?? null,
    image: row.images[0]?.url ?? null,
    categorySlug: row.category.slug,
    categoryNameAr: row.category.nameAr,
    defaultVariantId: pickDefaultVariantId(row.variants),
    discountPercent: discountPercentOf(row.priceCents, row.compareAtCents),
  }
}

export function toCategoryCard(row: CategoryCardRow): CategoryCard {
  let image: string | null = null
  for (const product of row.products) {
    const url = product.images[0]?.url
    if (url) {
      image = url
      break
    }
  }
  return {
    slug: row.slug,
    nameAr: row.nameAr,
    nameEn: row.nameEn,
    icon: row.icon,
    productCount: row._count.products,
    image,
  }
}
