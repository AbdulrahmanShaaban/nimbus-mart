export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useDb().heroSlide.findMany({
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  })

  return {
    items: rows.map((s) => ({
      id: s.id,
      titleAr: s.titleAr,
      subtitleAr: s.subtitleAr,
      ctaLabelAr: s.ctaLabelAr,
      ctaHref: s.ctaHref,
      imageUrl: s.imageUrl,
      bgStyle: s.bgStyle,
      sortOrder: s.sortOrder,
      enabled: s.enabled,
      updatedAt: s.updatedAt.toISOString(),
    })),
  }
})
