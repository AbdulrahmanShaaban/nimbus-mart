import type { Prisma } from '../../../generated/prisma/client'
import { firstHeroIssue, heroOrNone, heroSlidePatchSchema } from './index.post'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'معرّف الشريحة غير صالح' })
  }

  const body = await readBody(event)
  const parsed = heroSlidePatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `بيانات غير صالحة — ${firstHeroIssue(parsed.error)}`,
    })
  }

  const db = useDb()
  const existing = await db.heroSlide.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'الشريحة غير موجودة' })
  }

  const data = parsed.data
  const patch: Prisma.HeroSlideUpdateInput = {}
  if (data.titleAr !== undefined) patch.titleAr = data.titleAr
  if (data.titleEn !== undefined) patch.titleEn = heroOrNone(data.titleEn)
  if (data.subtitleAr !== undefined) patch.subtitleAr = heroOrNone(data.subtitleAr)
  if (data.subtitleEn !== undefined) patch.subtitleEn = heroOrNone(data.subtitleEn)
  if (data.ctaLabelAr !== undefined) patch.ctaLabelAr = data.ctaLabelAr
  if (data.ctaLabelEn !== undefined) patch.ctaLabelEn = heroOrNone(data.ctaLabelEn)
  if (data.ctaHref !== undefined) patch.ctaHref = data.ctaHref
  if (data.imageUrl !== undefined) patch.imageUrl = heroOrNone(data.imageUrl)
  if (data.bgStyle !== undefined) patch.bgStyle = data.bgStyle
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder
  if (data.enabled !== undefined) patch.enabled = data.enabled

  await db.heroSlide.update({ where: { id }, data: patch })
  await writeAudit(
    event,
    admin.id,
    'UPDATE',
    'hero_slide',
    id,
    { titleAr: existing.titleAr, bgStyle: existing.bgStyle, sortOrder: existing.sortOrder, enabled: existing.enabled },
    { ...patch },
  )

  return { ok: true }
})
