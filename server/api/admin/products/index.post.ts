import { z } from 'zod'
import { normalizeArabic } from '#shared/utils/normalize-ar'

export const adminProductVariantSchema = z.object({
  id: z.string().min(1).optional(),
  sku: z.string().min(1),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  priceCents: z.string().regex(/^\d+$/).nullable().optional(),
  stock: z.number().int().min(0).max(9999),
  imageUrl: z.string().nullable().optional(),
})

export const adminProductSchema = z.object({
  titleAr: z.string().min(2),
  titleEn: z.string().optional().or(z.literal('')),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2),
  categoryId: z.string().min(1),
  descriptionAr: z.string().min(2),
  priceCents: z.string().regex(/^\d+$/),
  compareAtCents: z.string().regex(/^\d+$/).nullable().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  images: z.array(z.string().url()).max(10).default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        size: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        colorHex: z.string().nullable().optional(),
        priceCents: z.string().regex(/^\d+$/).nullable().optional(),
        stock: z.number().int().min(0).max(9999),
        imageUrl: z.string().nullable().optional(),
      }),
    )
    .min(1),
})

export type AdminProductPayload = z.infer<typeof adminProductSchema>

export function firstZodIssue(err: z.ZodError): string {
  const issue = err.issues[0]
  if (!issue) return 'بيانات غير صالحة'
  const path = issue.path.join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}

export function isDbErrorCode(e: unknown, codes: string[]): boolean {
  if (typeof e !== 'object' || e === null) return false
  const code = 'code' in e ? (e as { code?: unknown }).code : undefined
  return typeof code === 'string' && codes.includes(code)
}

export function isFkViolation(e: unknown): boolean {
  if (isDbErrorCode(e, ['P2003', 'P2014'])) return true
  const msg = e instanceof Error ? e.message.toLowerCase() : ''
  return msg.includes('foreign key')
}

export function orNull(v: string | null | undefined): string | null {
  return v == null || v === '' ? null : v
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const parsed = adminProductSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `بيانات غير صالحة — ${firstZodIssue(parsed.error)}`,
    })
  }
  const data = parsed.data

  const db = useDb()

  const slugExists = await db.product.findUnique({ where: { slug: data.slug }, select: { id: true } })
  if (slugExists) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'الرابط (Slug) مستخدم لمنتج آخر — اختر رابطًا مختلفًا',
    })
  }

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })
  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'التصنيف غير موجود' })
  }

  let createdId: string
  try {
    const created = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug: data.slug,
          categoryId: data.categoryId,
          titleAr: data.titleAr,
          titleEn: orNull(data.titleEn),
          descriptionAr: data.descriptionAr,
          priceCents: BigInt(data.priceCents),
          compareAtCents: data.compareAtCents != null ? BigInt(data.compareAtCents) : null,
          status: data.status,
          searchNormalized: normalizeArabic(`${data.titleAr} ${data.titleEn || ''}`),
        },
      })
      if (data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((url, index) => ({ productId: product.id, url, sort: index })),
        })
      }
      await tx.variant.createMany({
        data: data.variants.map((v) => ({
          productId: product.id,
          sku: v.sku,
          size: orNull(v.size),
          color: orNull(v.color),
          colorHex: orNull(v.colorHex),
          priceCents: v.priceCents != null ? BigInt(v.priceCents) : null,
          stock: v.stock,
          imageUrl: orNull(v.imageUrl),
        })),
      })
      return product
    })
    createdId = created.id
  } catch (e) {
    if (isDbErrorCode(e, ['P2002'])) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'رمز SKU مستخدم مسبقًا — كل متغير يحتاج رمزًا فريدًا',
      })
    }
    throw e
  }

  await writeAudit(event, admin.id, 'CREATE', 'product', createdId, null, {
    slug: data.slug,
    titleAr: data.titleAr,
    status: data.status,
    priceCents: data.priceCents,
  })

  return { id: createdId }
})
