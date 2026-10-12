import { z } from 'zod'

const currencyPatchSchema = z.object({
  rate: z.string().regex(/^\d+(\.\d{1,8})$/).optional(),
  symbol: z.string().max(6).optional(),
  position: z.enum(['BEFORE', 'AFTER']).optional(),
  decimals: z.number().int().min(0).max(4).optional(),
  enabled: z.boolean().optional(),
  isBase: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const code = getRouterParam(event, 'code')
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'رمز العملة غير صالح' })
  }

  const body = await readBody(event)
  const parsed = currencyPatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'بيانات العملة غير صالحة — السعر يقبل حتى 8 خانات عشرية',
    })
  }
  const data = parsed.data

  const db = useDb()
  const row = await db.currencyRate.findUnique({ where: { code } })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'العملة غير موجودة' })
  }

  if (data.isBase === false && row.isBase) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'لا يمكن إلغاء العملة الأساسية بدون بديل',
    })
  }

  const before = {
    rate: row.rate.toString(),
    symbol: row.symbol,
    position: row.position,
    decimals: row.decimals,
    enabled: row.enabled,
    isBase: row.isBase,
  }

  const patch: {
    rate?: string
    symbol?: string
    position?: 'BEFORE' | 'AFTER'
    decimals?: number
    enabled?: boolean
    isBase?: boolean
  } = {}
  if (data.rate !== undefined) patch.rate = data.rate
  if (data.symbol !== undefined) patch.symbol = data.symbol
  if (data.position !== undefined) patch.position = data.position
  if (data.decimals !== undefined) patch.decimals = data.decimals
  if (data.enabled !== undefined) patch.enabled = data.enabled

  if (data.isBase === true && !row.isBase) {
    await db.$transaction([
      db.currencyRate.updateMany({ where: { code: { not: code } }, data: { isBase: false } }),
      db.currencyRate.update({ where: { code }, data: { ...patch, isBase: true } }),
    ])
  } else {
    if (data.isBase !== undefined) patch.isBase = data.isBase
    await db.currencyRate.update({ where: { code }, data: patch })
  }

  await writeAudit(event, admin.id, 'UPDATE', 'currency_rate', code, before, {
    rate: data.rate ?? before.rate,
    symbol: data.symbol ?? before.symbol,
    position: data.position ?? before.position,
    decimals: data.decimals ?? before.decimals,
    enabled: data.enabled ?? before.enabled,
    isBase: data.isBase ?? before.isBase,
  })

  return { ok: true }
})
