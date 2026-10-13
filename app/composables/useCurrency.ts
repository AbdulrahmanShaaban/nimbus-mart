import { useI18n } from 'vue-i18n'

export interface CurrencyRow {
  code: string
  rate: string
  symbol: string
  position: 'BEFORE' | 'AFTER'
  decimals: number
  roundingStepCents: string | null
  enabled: boolean
  isBase: boolean
}

export function useCurrency() {
  const { locale } = useI18n()
  const rates = useState<CurrencyRow[]>('nm-currency-rates', () => [])

  const currencyCookie = useCookie<string>('nm_currency', {
    default: () => 'EGP',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const currency = computed({
    get: () => currencyCookie.value || 'EGP',
    set: (v: string) => {
      currencyCookie.value = v
    },
  })

  const currencies = computed(() => rates.value.filter(r => r.enabled))

  const current = computed(
    () => rates.value.find(r => r.code === currency.value) ?? rates.value.find(r => r.isBase) ?? null,
  )

  async function loadRates(force = false) {
    if (rates.value.length > 0 && !force) return
    const res = await $fetch<{ rates: CurrencyRow[] }>('/api/currencies')
    rates.value = res.rates
  }

  function formatBase(baseCents: string | bigint): string {
    const cents = typeof baseCents === 'bigint' ? baseCents : BigInt(baseCents)
    const row = current.value
    if (!row || row.isBase || row.code === 'EGP') {
      const label = locale.value === 'en' ? 'EGP' : 'ج.م'
      return `${formatMinor(cents, 2)} ${label}`
    }
    const minor = convertToDisplayMinor(
      cents,
      row.rate,
      row.decimals,
      row.roundingStepCents ? BigInt(row.roundingStepCents) : null,
    )
    const num = formatMinor(minor, row.decimals)
    return row.position === 'BEFORE' ? `${row.symbol}${num}` : `${num} ${row.symbol}`
  }

  return { currency, currencies, current, loadRates, formatBase }
}
