export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const s = await useDb().siteSetting.findUnique({ where: { key: 'default' } })

  return {
    promoHeadingAr: s?.promoHeadingAr ?? null,
    promoHeadingEn: s?.promoHeadingEn ?? null,
    promoBodyAr: s?.promoBodyAr ?? null,
    promoBodyEn: s?.promoBodyEn ?? null,
    promoCtaLabelAr: s?.promoCtaLabelAr ?? null,
    promoCtaLabelEn: s?.promoCtaLabelEn ?? null,
    promoCtaHref: s?.promoCtaHref ?? null,
    promoGradient: s?.promoGradient ?? null,
    promoImageUrl: s?.promoImageUrl ?? null,
    promoSecondHeadingAr: s?.promoSecondHeadingAr ?? null,
    promoSecondHeadingEn: s?.promoSecondHeadingEn ?? null,
    promoSecondBodyAr: s?.promoSecondBodyAr ?? null,
    promoSecondBodyEn: s?.promoSecondBodyEn ?? null,
    promoSecondCtaLabelAr: s?.promoSecondCtaLabelAr ?? null,
    promoSecondCtaLabelEn: s?.promoSecondCtaLabelEn ?? null,
    promoSecondCtaHref: s?.promoSecondCtaHref ?? null,
    promoSecondGradient: s?.promoSecondGradient ?? null,
    promoSecondImageUrl: s?.promoSecondImageUrl ?? null,
    footerBlurbAr: s?.footerBlurbAr ?? null,
    footerBlurbEn: s?.footerBlurbEn ?? null,
  }
})
