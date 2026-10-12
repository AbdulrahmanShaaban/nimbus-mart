export default defineEventHandler(async () => {
  const db = useDb()
  const [settings, categories] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: 'default' } }),
    db.category.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, nameAr: true },
    }),
  ])

  return { blurbAr: settings?.footerBlurbAr ?? null, categories }
})
