import { z } from 'zod'
import type { Prisma } from '../../generated/prisma/client'

const settingsSchema = z.object({
  promoHeadingAr: z.string().nullable().optional(),
  promoHeadingEn: z.string().nullable().optional(),
  promoBodyAr: z.string().nullable().optional(),
  promoBodyEn: z.string().nullable().optional(),
  promoCtaLabelAr: z.string().nullable().optional(),
  promoCtaLabelEn: z.string().nullable().optional(),
  promoCtaHref: z.string().nullable().optional(),
  promoGradient: z.string().nullable().optional(),
  promoImageUrl: z.string().nullable().optional(),
  promoSecondHeadingAr: z.string().nullable().optional(),
  promoSecondHeadingEn: z.string().nullable().optional(),
  promoSecondBodyAr: z.string().nullable().optional(),
  promoSecondBodyEn: z.string().nullable().optional(),
  promoSecondCtaLabelAr: z.string().nullable().optional(),
  promoSecondCtaLabelEn: z.string().nullable().optional(),
  promoSecondCtaHref: z.string().nullable().optional(),
  promoSecondGradient: z.string().nullable().optional(),
  promoSecondImageUrl: z.string().nullable().optional(),
  footerBlurbAr: z.string().nullable().optional(),
  footerBlurbEn: z.string().nullable().optional(),
})

const SETTINGS_KEYS = [
  'promoHeadingAr',
  'promoHeadingEn',
  'promoBodyAr',
  'promoBodyEn',
  'promoCtaLabelAr',
  'promoCtaLabelEn',
  'promoCtaHref',
  'promoGradient',
  'promoImageUrl',
  'promoSecondHeadingAr',
  'promoSecondHeadingEn',
  'promoSecondBodyAr',
  'promoSecondBodyEn',
  'promoSecondCtaLabelAr',
  'promoSecondCtaLabelEn',
  'promoSecondCtaHref',
  'promoSecondGradient',
  'promoSecondImageUrl',
  'footerBlurbAr',
  'footerBlurbEn',
] as const

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'بيانات إعدادات المحتوى غير صالحة',
    })
  }

  const clean = (v: string | null | undefined): string | null =>
    v == null || v.trim() === '' ? null : v.trim()

  const db = useDb()
  const existing = await db.siteSetting.findUnique({ where: { key: 'default' } })

  const before: Record<string, string | null> = {}
  if (existing) {
    for (const k of SETTINGS_KEYS) before[k] = existing[k] ?? null
  }

  if (!existing) {
    const createData: Prisma.SiteSettingCreateInput = { key: 'default' }
    for (const k of SETTINGS_KEYS) {
      const v = parsed.data[k]
      createData[k] = clean(v)
    }
    await db.siteSetting.create({ data: createData })
  } else {
    const updateData: Prisma.SiteSettingUpdateInput = {}
    for (const k of SETTINGS_KEYS) {
      const v = parsed.data[k]
      if (v !== undefined) updateData[k] = clean(v)
    }
    await db.siteSetting.update({ where: { key: 'default' }, data: updateData })
  }

  const after: Record<string, string | null> = {}
  for (const k of SETTINGS_KEYS) {
    const v = parsed.data[k]
    after[k] = v !== undefined ? clean(v) : (before[k] ?? null)
  }

  await writeAudit(event, admin.id, existing ? 'UPDATE' : 'CREATE', 'site_setting', 'default', existing ? before : null, after)

  return { ok: true }
})
