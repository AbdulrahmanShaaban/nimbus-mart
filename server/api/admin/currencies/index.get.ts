export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().currencyRate.findMany({
    orderBy: [{ isBase: 'desc' }, { code: 'asc' }],
  })

  return {
    items: rows.map((r) => ({
      code: r.code,
      rate: r.rate.toString(),
      symbol: r.symbol,
      position: r.position,
      decimals: r.decimals,
      roundingStepCents: r.roundingStepCents?.toString() ?? null,
      enabled: r.enabled,
      isBase: r.isBase,
      updatedAt: r.updatedAt.toISOString(),
    })),
  }
})
