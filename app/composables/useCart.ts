export interface CartItemView {
  id: string
  variantId: string
  quantity: number
  unitPriceCents: string
  lineTotalCents: string
  stock: number
  size: string | null
  color: string | null
  colorHex: string | null
  productTitleAr: string
  productSlug: string
  imageUrl: string | null
}

export interface CartView {
  items: CartItemView[]
  subtotalCents: string
  count: number
}

const EMPTY: CartView = { items: [], subtotalCents: '0', count: 0 }

export function useCart() {
  const cart = useState<CartView>('nm-cart', () => ({ ...EMPTY }))
  const cartLoaded = useState<boolean>('nm-cart-loaded', () => false)

  async function refresh() {
    try {
      cart.value = await $fetch<CartView>('/api/cart')
    } catch {
      cart.value = { ...EMPTY }
    } finally {
      cartLoaded.value = true
    }
  }

  async function addItem(variantId: string, quantity = 1) {
    cart.value = await $fetch<CartView>('/api/cart/items', {
      method: 'POST',
      body: { variantId, quantity },
    })
  }

  async function updateItem(id: string, quantity: number) {
    cart.value = await $fetch<CartView>(`/api/cart/items/${id}`, {
      method: 'PATCH',
      body: { quantity },
    })
  }

  async function removeItem(id: string) {
    cart.value = await $fetch<CartView>(`/api/cart/items/${id}`, {
      method: 'DELETE',
    })
  }

  const count = computed(() => cart.value.count)
  const subtotalCents = computed(() => cart.value.subtotalCents)

  return { cart, cartLoaded, count, subtotalCents, refresh, addItem, updateItem, removeItem }
}
