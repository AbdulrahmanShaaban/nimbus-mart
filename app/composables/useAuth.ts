export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'CUSTOMER' | 'ADMIN'
}

export function useAuth() {
  const user = useState<AuthUser | null>('nm-user', () => null)
  const loaded = useState<boolean>('nm-user-loaded', () => false)

  async function refresh() {
    try {
      const requestFetch = useRequestFetch()
      const res = await requestFetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = res.user
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = res.user
    loaded.value = true
    return res.user
  }

  async function register(payload: { email: string; password: string; name: string }) {
    const res = await $fetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })
    user.value = res.user
    loaded.value = true
    return res.user
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  return { user, loaded, refresh, login, register, logout, isAdmin }
}
