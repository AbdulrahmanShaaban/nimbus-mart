import { describe, expect, it } from 'vitest'
import { normalizeArabic as normalizeAr } from '../shared/utils/normalize-ar'

describe('normalizeAr', () => {
  it('strips tashkeel', () => {
    expect(normalizeAr('مُحَمَّد')).toBe('محمد')
    expect(normalizeAr('إلكترونيات')).toBe('الكترونيات')
  })

  it('unifies alef variants and alef maqsura', () => {
    expect(normalizeAr('أحمر آبيض إلكترونيات')).toBe('احمر ابيض الكترونيات')
    expect(normalizeAr('موسى')).toBe('موسي')
  })

  it('converts ta marbuta to ha', () => {
    expect(normalizeAr('فستانة صغيرة')).toBe('فستانه صغيره')
  })

  it('converts eastern digits to latin', () => {
    expect(normalizeAr('١٢٣')).toBe('123')
  })

  it('removes tatweel and collapses whitespace, lowercases', () => {
    expect(normalizeAr('قـــمص  ان')).toBe('قمص ان')
    expect(normalizeAr('iPhone 13 Pro')).toBe('iphone 13 pro')
  })
})
