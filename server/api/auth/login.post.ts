import { z } from 'zod'
import { verifyPassword } from '../../utils/password'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

interface AuthUserResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'CUSTOMER' | 'ADMIN'
  }
}

export default defineEventHandler(async (event): Promise<AuthUserResponse> => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION',
      message: parsed.error.issues
        .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
        .join('; '),
    })
  }

  const email = parsed.data.email.toLowerCase()
  const user = await useDb().user.findUnique({ where: { email } })
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'BAD_CREDENTIALS' })
  }

  const token = newSessionToken()
  await useDb().session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  })
  setSessionCookie(event, token)

  const sid = ensureGuestSid(event)
  await mergeGuestCart(sid, user.id)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
})
