import { z } from 'zod'
import { hashPassword } from '../../utils/password'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(2),
  phone: z
    .string()
    .regex(/^01[0-5]\d{8}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
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
  const parsed = registerSchema.safeParse(body)
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
  const db = useDb()
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'EMAIL_TAKEN' })
  }

  let user
  try {
    user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(parsed.data.password),
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
        role: 'CUSTOMER',
      },
    })
  } catch (e) {
    if (isUniqueViolation(e)) {
      throw createError({ statusCode: 409, statusMessage: 'EMAIL_TAKEN' })
    }
    throw e
  }

  const token = newSessionToken()
  await db.session.create({
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

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code?: string }).code === 'P2002'
  )
}
