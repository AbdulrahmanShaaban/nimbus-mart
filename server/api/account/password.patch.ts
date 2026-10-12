import { z } from 'zod'
import { verifyPassword, hashPassword } from '../../utils/password'

const passwordPatchSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = passwordPatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION',
      message: parsed.error.issues
        .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
        .join('; '),
    })
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'BAD_PASSWORD' })
  }

  await useDb().user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  })

  const token = getCookie(event, SESSION_COOKIE)
  if (token) {
    await useDb().session.deleteMany({
      where: { userId: user.id, token: { not: token } },
    })
  }

  return { ok: true as const }
})
