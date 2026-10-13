import { z } from 'zod'

export const heroSlideFields = {
  titleAr: z.string().min(1),
  titleEn: z.string().min(1).nullable().optional(),
  subtitleAr: z.string().min(1).nullable().optional(),
  subtitleEn: z.string().min(1).nullable().optional(),
  ctaLabelAr: z.string().min(1),
  ctaLabelEn: z.string().min(1).nullable().optional(),
  ctaHref: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  bgStyle: z.enum(['BLUE', 'AMBER', 'INK']),
  sortOrder: z.number().int(),
  enabled: z.boolean(),
}

export const heroSlideCreateSchema = z.object(heroSlideFields).extend({
  sortOrder: z.number().int().default(0),
  enabled: z.boolean().default(true),
})

export const heroSlidePatchSchema = z.object(heroSlideFields).partial()

export function firstHeroIssue(err: z.ZodError): string {
  const issue = err.issues[0]
  if (!issue) return 'بيانات غير صالحة'
  const path = issue.path.join('.')
  return path ? `${path}: ${issue.message}` : issue.message
}

export function heroOrNone(v: string | null | undefined): string | null {
  return v == null || v === '' ? null : v
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const parsed = heroSlideCreateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: `بيانات غير صالحة — ${firstHeroIssue(parsed.error)}`,
    })
  }
  const data = parsed.data

  const created = await useDb().heroSlide.create({
    data: {
      titleAr: data.titleAr,
      titleEn: heroOrNone(data.titleEn),
      subtitleAr: heroOrNone(data.subtitleAr),
      subtitleEn: heroOrNone(data.subtitleEn),
      ctaLabelAr: data.ctaLabelAr,
      ctaLabelEn: heroOrNone(data.ctaLabelEn),
      ctaHref: data.ctaHref,
      imageUrl: heroOrNone(data.imageUrl),
      bgStyle: data.bgStyle,
      sortOrder: data.sortOrder,
      enabled: data.enabled,
    },
  })

  await writeAudit(event, admin.id, 'CREATE', 'hero_slide', created.id, null, {
    titleAr: data.titleAr,
    bgStyle: data.bgStyle,
    sortOrder: data.sortOrder,
    enabled: data.enabled,
  })

  return { id: created.id }
})
