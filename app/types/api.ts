export type BgStyle = 'BLUE' | 'AMBER' | 'INK'

export interface HeroSlideDto {
  id: string
  titleAr: string
  subtitleAr: string
  ctaLabelAr: string
  ctaHref: string
  imageUrl: string
  bgStyle: BgStyle
}

export interface CategoryDto {
  slug: string
  nameAr: string
  nameEn: string
  icon: string
  productCount: number
  image: string
}

export interface ProductCardDto {
  productId: string
  slug: string
  titleAr: string
  titleEn: string
  priceCents: string
  compareAtCents: string | null
  image: string
  categorySlug: string
  categoryNameAr: string
  defaultVariantId: string | null
  discountPercent: number | null
}

export interface PromoBlockDto {
  headingAr: string
  bodyAr: string
  ctaLabelAr: string
  ctaHref: string
  gradient: string
  imageUrl: string
}

export interface HomeContentDto {
  heroSlides: HeroSlideDto[]
  categories: CategoryDto[]
  featured: ProductCardDto[]
  newest: ProductCardDto[]
  bestSellers: ProductCardDto[]
  sale: ProductCardDto[]
  promo: PromoBlockDto | null
  promoSecond: PromoBlockDto | null
  footerBlurbAr: string
}

export interface FooterContentDto {
  blurbAr: string
  categories: { slug: string; nameAr: string }[]
}

export interface ProductListDto {
  items: ProductCardDto[]
  total: number
  page: number
  pageSize: number
}

export interface ProductVariantDto {
  id: string
  sku: string
  size: string | null
  color: string | null
  colorHex: string | null
  stock: number
  priceCents: string | null
  imageUrl: string | null
}

export interface ProductDetailDto {
  productId: string
  slug: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  priceCents: string
  compareAtCents: string | null
  discountPercent: number | null
  category: { slug: string; nameAr: string }
  images: string[]
  variants: ProductVariantDto[]
  defaultVariantId: string | null
  related: ProductCardDto[]
}

export interface WishlistResponseDto {
  items: ProductCardDto[]
}

export interface CheckoutResponseDto {
  orderNumber: string
  totalCents: string
}

export type OrderStatus = 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface OrderItemDto {
  productTitleSnapshot: string
  quantity: number
  lineTotalCents: string
  unitPriceCents?: string
  imageUrl?: string | null
  variantSnapshot?: string
}

export interface OrderDetailDto {
  orderNumber: string
  status: OrderStatus
  totalCents: string
  createdAt: string
  isOwner: boolean
  items: OrderItemDto[]
  name?: string
  phone?: string
  governorate?: string
  addressLine?: string
  notes?: string | null
  email?: string
  paymentMode?: string
  subtotalCents?: string
  shippingCents?: string
}

export interface AccountDto {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
}

export interface AccountOrderSummaryDto {
  orderNumber: string
  createdAt: string
  status: OrderStatus
  totalCents: string
  itemCount: number
}

export interface AccountOrderListDto {
  items: AccountOrderSummaryDto[]
  total: number
  page: number
}
