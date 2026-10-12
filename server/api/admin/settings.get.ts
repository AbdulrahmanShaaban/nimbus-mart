export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const s = await useDb().siteSetting.findUnique({ where: { key: 'default' } })

  return {
    promoHeadingAr: s?.promoHeadingAr ?? null,
    promoBodyAr: s?.promoBodyAr ?? null,
    promoCtaLabelAr: s?.promoCtaLabelAr ?? null,
    promoCtaHref: s?.promoCtaHref ?? null,
    promoGradient: s?.promoGradient ?? null,
    promoImageUrl: s?.promoImageUrl ?? null,
    promoSecondHeadingAr: s?.promoSecondHeadingAr ?? null,
    promoSecondBodyAr: s?.promoSecondBodyAr ?? null,
    promoSecondCtaLabelAr: s?.promoSecondCtaLabelAr ?? null,
    promoSecondCtaHref: s?.promoSecondCtaHref ?? null,
    promoSecondGradient: s?.promoSecondGradient ?? null,
    promoSecondImageUrl: s?.promoSecondImageUrl ?? null,
    footerBlurbAr: s?.footerBlurbAr ?? null,
  }
})
