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
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
})
