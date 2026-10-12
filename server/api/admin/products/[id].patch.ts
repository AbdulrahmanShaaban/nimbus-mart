import { normalizeArabic } from '#shared/utils/normalize-ar'
import {
  adminProductSchema,
  adminProductVariantSchema,
  firstZodIssue,
  isDbErrorCode,
  isFkViolation,
  orNull,
} from './index.post'

const adminProductPatchSchema = adminProductSchema.extend({
  variants: adminProductVariantSchema.array().min(1),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'معرّف المنتج غير صالح' })
  }

  const body = await readBody(event)
  const parsed = adminProductPatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `بيانات غير صالحة — ${firstZodIssue(parsed.error)}`,
    })
  }
  const data = parsed.data

  const db = useDb()

  const existing = await db.product.findUnique({
    where: { id },
    include: { variants: { select: { id: true, sku: true } } },
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'المنتج غير موجود' })
  }

  if (data.slug !== existing.slug) {
    const slugConflict = await db.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    })
    if (slugConflict) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'الرابط (Slug) مستخدم لمنتج آخر — اختر رابطًا مختلفًا',
      })
    }
  }

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })
  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'التصنيف غير موجود' })
  }

  const existingVariantIds = new Set(existing.variants.map((v) => v.id))
  for (const v of data.variants) {
    if (v.id && !existingVariantIds.has(v.id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'أحد المتغيرات لا يخص هذا المنتج — أعد تحميل الصفحة',
      })
    }
  }

  const before = {
    slug: existing.slug,
    titleAr: existing.titleAr,
    titleEn: existing.titleEn,
    descriptionAr: existing.descriptionAr,
    priceCents: existing.priceCents.toString(),
    compareAtCents: existing.compareAtCents?.toString() ?? null,
    status: existing.status,
    categoryId: existing.categoryId,
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
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

      await tx.productImage.deleteMany({ where: { productId: id } })
      if (data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((url, index) => ({ productId: id, url, sort: index })),
        })
      }

      const incomingIds = new Set<string>()
      for (const v of data.variants) {
        const variantData = {
          sku: v.sku,
          size: orNull(v.size),
          color: orNull(v.color),
          colorHex: orNull(v.colorHex),
          priceCents: v.priceCents != null ? BigInt(v.priceCents) : null,
          stock: v.stock,
          imageUrl: orNull(v.imageUrl),
        }
        if (v.id) {
          incomingIds.add(v.id)
          await tx.variant.update({ where: { id: v.id }, data: variantData })
        } else {
          const created = await tx.variant.create({ data: { ...variantData, productId: id } })
          incomingIds.add(created.id)
        }
      }

      for (const old of existing.variants) {
        if (incomingIds.has(old.id)) continue
        try {
          await tx.variant.delete({ where: { id: old.id } })
        } catch (e) {
          if (isFkViolation(e)) {
            throw createError({
              statusCode: 409,
              statusMessage: 'Conflict',
              message: `لا يمكن حذف متغير ${old.sku} لوجود طلبات سابقة`,
            })
          }
          throw e
        }
      }
    })
  } catch (e) {
    if (e && typeof e === 'object' && 'statusCode' in e) throw e
    if (isDbErrorCode(e, ['P2002'])) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'رمز SKU مستخدم مسبقًا — كل متغير يحتاج رمزًا فريدًا',
      })
    }
    throw e
  }

  await writeAudit(event, admin.id, 'UPDATE', 'product', id, before, {
    slug: data.slug,
    titleAr: data.titleAr,
    titleEn: orNull(data.titleEn),
    descriptionAr: data.descriptionAr,
    priceCents: data.priceCents,
    compareAtCents: data.compareAtCents ?? null,
    status: data.status,
    categoryId: data.categoryId,
  })

  return { ok: true }
})
