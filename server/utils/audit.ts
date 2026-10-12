import type { H3Event } from 'h3'

export async function writeAudit(
  event: H3Event,
  actorUserId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  before: unknown = null,
  after: unknown = null,
): Promise<void> {
  await useDb().auditLog.create({
    data: {
      actorUserId,
      action,
      entity,
      entityId,
      before: before === null ? undefined : (before as object),
      after: after === null ? undefined : (after as object),
    },
  })
}
