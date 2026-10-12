interface MeResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'CUSTOMER' | 'ADMIN'
  } | null
}

export default defineEventHandler(async (event): Promise<MeResponse> => {
  const user = await optionalUser(event)
  if (!user) return { user: null }
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
})
