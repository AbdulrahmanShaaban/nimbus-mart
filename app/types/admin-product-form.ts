export interface AdminProductVariantValue {
  id?: string
  sku: string
  size: string | null
  color: string | null
  colorHex: string | null
  priceCents: string | null
  stock: number
  imageUrl: string | null
}

export interface AdminProductFormValue {
  titleAr: string
  titleEn: string
  slug: string
  categoryId: string
  descriptionAr: string
  priceCents: string
  compareAtCents: string | null
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  images: string[]
  variants: AdminProductVariantValue[]
}

export interface AdminProductInitial {
  id?: string
  slug: string
  titleAr: string
  titleEn: string | null
  descriptionAr: string
  priceCents: string
  compareAtCents: string | null
  status: string
  categoryId: string
  images: string[]
  variants: AdminProductVariantValue[]
}
