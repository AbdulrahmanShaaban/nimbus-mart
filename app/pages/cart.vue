<script setup lang="ts">
import { ShoppingBag, Trash, ArrowLeft } from '@lucide/vue'

useHead({ title: 'سلة التسوق — نِمبوس مارت' })

const { cart, cartLoaded, refresh, updateItem, removeItem, subtotalCents } = useCart()
const { formatBase } = useCurrency()

const busyItemId = ref<string | null>(null)
const actionError = ref<string | null>(null)

const items = computed(() => cart.value.items)
const subtotal = computed(() => formatBase(subtotalCents.value))

function errStatus(error: unknown): number | null {
  if (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof error.statusCode === 'number'
  ) {
    return error.statusCode
  }
  return null
}

async function changeQuantity(id: string, quantity: number) {
  if (quantity < 1 || quantity > 99) return
  busyItemId.value = id
  actionError.value = null
  try {
    await updateItem(id, quantity)
  } catch (error) {
    if (errStatus(error) === 401) {
      await navigateTo('/login')
      return
    }
    actionError.value = 'تعذّر تحديث الكمية، حاول مرة أخرى.'
    await refresh()
  } finally {
    busyItemId.value = null
  }
}

async function removeItemById(id: string) {
  busyItemId.value = id
  actionError.value = null
  try {
    await removeItem(id)
  } catch (error) {
    if (errStatus(error) === 401) {
      await navigateTo('/login')
      return
    }
    actionError.value = 'تعذّر حذف المنتج، حاول مرة أخرى.'
    await refresh()
  } finally {
    busyItemId.value = null
  }
}

onMounted(() => {
  refresh()
})
</script>

<template>
  <div class="mx-auto max-w-[1330px] px-4 py-8 md:px-6 md:py-12">
    <h1 class="mb-6 text-2xl font-extrabold text-navy md:text-3xl">سلة التسوق</h1>

    <EmptyState
      v-if="cartLoaded && items.length === 0"
      title="سلتك فارغة"
      hint="ابدأ التسوق وأضف منتجات إلى السلة لتظهر هنا."
      action-label="تسوّق الآن"
      action-href="/products"
      :icon="ShoppingBag"
    />

    <div v-else class="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div class="flex flex-col gap-3">
        <p v-if="!cartLoaded" class="text-sm text-mutedtext" aria-live="polite">جاري التحميل…</p>

        <p
          v-if="actionError"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {{ actionError }}
        </p>

        <article
          v-for="item in items"
          :key="item.id"
          class="flex gap-4 rounded-2xl border border-line bg-white p-4"
        >
          <NuxtLink
            :to="`/products/${item.productSlug}`"
            class="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#FAFAFA] focus-visible:outline-2 focus-visible:outline-brand"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.productTitleAr"
              loading="lazy"
              class="h-full w-full object-contain"
            >
          </NuxtLink>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <NuxtLink
                :to="`/products/${item.productSlug}`"
                class="line-clamp-2 text-sm font-bold text-navy transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                {{ item.productTitleAr }}
              </NuxtLink>
              <button
                type="button"
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand"
                :disabled="busyItemId === item.id"
                :aria-label="`حذف ${item.productTitleAr} من السلة`"
                @click="removeItemById(item.id)"
              >
                <Trash :size="17" aria-hidden="true" />
              </button>
            </div>

            <p v-if="item.size || item.color" class="text-xs text-mutedtext">
              <template v-if="item.size">المقاس: {{ item.size }}</template>
              <template v-if="item.size && item.color"> · </template>
              <template v-if="item.color">اللون: {{ item.color }}</template>
            </p>

            <div class="mt-auto flex flex-wrap items-center justify-between gap-3">
              <QtyStepper
                :model-value="item.quantity"
                :max="Math.max(1, item.stock)"
                :disabled="busyItemId === item.id"
                @update:model-value="changeQuantity(item.id, $event)"
              />
              <span class="text-sm font-black text-navy">{{ formatBase(item.lineTotalCents) }}</span>
            </div>
          </div>
        </article>
      </div>

      <aside>
        <div class="rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-44">
          <h2 class="mb-4 text-base font-extrabold text-navy">ملخص الطلب</h2>
          <dl class="mb-4 flex flex-col gap-2 text-sm">
            <div class="flex items-center justify-between">
              <dt class="text-bodytext">الإجمالي الفرعي</dt>
              <dd class="font-bold text-navy">{{ subtotal }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-bodytext">الشحن</dt>
              <dd class="text-mutedtext">يُحتسب عند إتمام الطلب</dd>
            </div>
          </dl>
          <div class="mb-5 border-t border-line pt-4">
            <div class="flex items-center justify-between">
              <span class="font-bold text-navy">الإجمالي</span>
              <span class="text-lg font-black text-navy">{{ subtotal }}</span>
            </div>
          </div>
          <NuxtLink
            to="/checkout"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neon text-sm font-black text-brand-alt transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand"
          >
            إتمام الشراء
            <ArrowLeft :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>
