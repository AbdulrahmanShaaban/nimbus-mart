export default defineEventHandler(async () => {
  const rows = await useDb().currencyRate.findMany({
    where: { enabled: true },
    orderBy: [{ isBase: 'desc' }, { code: 'asc' }],
  })

  return {
    rates: rows.map(r => ({
      code: r.code,
      rate: r.rate.toString(),
      symbol: r.symbol,
      position: r.position,
      decimals: r.decimals,
      roundingStepCents: r.roundingStepCents?.toString() ?? null,
      enabled: r.enabled,
      isBase: r.isBase,
    })),
  }
})
