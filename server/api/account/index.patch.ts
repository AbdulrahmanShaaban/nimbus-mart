import { z } from 'zod'

const profilePatchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z.union([z.string().regex(/^01[0-5]\d{8}$/), z.literal('')]).optional(),
})

interface AccountProfile {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
}

export default defineEventHandler(async (event): Promise<AccountProfile> => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = profilePatchSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'VALIDATION',
      message: parsed.error.issues
        .map((issue) => (issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
        .join('; '),
    })
  }

  const data: { name?: string; phone?: string | null } = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.phone !== undefined) {
    data.phone = parsed.data.phone === '' ? null : parsed.data.phone
  }

  const updated =
    Object.keys(data).length > 0
      ? await useDb().user.update({ where: { id: user.id }, data })
      : user

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
    role: updated.role,
    createdAt: updated.createdAt.toISOString(),
  }
})
