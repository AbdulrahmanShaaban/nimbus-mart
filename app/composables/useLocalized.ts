import { useI18n } from 'vue-i18n'

/**
 * Pick the locale-appropriate field from bilingual content.
 * Falls back to Arabic when the English value is missing.
 */
export function useLocalized() {
  const { locale } = useI18n()

  function pick(ar: string | null | undefined, en?: string | null): string {
    if (locale.value === 'en' && en != null && en !== '') return en
    return ar ?? ''
  }

  return { locale, pick }
}
