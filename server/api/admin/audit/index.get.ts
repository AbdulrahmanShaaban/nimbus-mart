function qint(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'string' ? Number.parseInt(v, 10) : Number.NaN
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const page = qint(query.page, 1, 1, 10_000)
  const limit = qint(query.limit, 30, 1, 100)

  const db = useDb()
  const [total, rows] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { actor: { select: { email: true } } },
    }),
  ])

  return {
    items: rows.map((a) => ({
      id: a.id,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      actorEmail: a.actor?.email ?? null,
      before: a.before ?? null,
      after: a.after ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    total,
    page,
  }
})
