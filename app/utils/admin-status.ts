export const ADMIN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  ACTIVE: 'نشط',
  ARCHIVED: 'مؤرشف',
  PLACED: 'تم الاستلام',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
  ADMIN: 'مدير',
  CUSTOMER: 'عميل',
}

export function adminStatusLabel(status: string): string {
  return ADMIN_STATUS_LABELS[status] ?? status
}

export function adminStatusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    case 'DRAFT':
    case 'PLACED':
      return 'bg-gray-100 text-gray-700'
    case 'ARCHIVED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'PROCESSING':
      return 'bg-amber-100 text-amber-800'
    case 'SHIPPED':
      return 'bg-blue-100 text-blue-800'
    case 'ADMIN':
      return 'bg-navy/10 text-navy'
    case 'CUSTOMER':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const dateFmtShort = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  calendar: 'gregory',
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateFmtFull = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  calendar: 'gregory',
  timeZone: 'Africa/Cairo',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function adminFormatDate(iso: string, withTime = false): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return withTime ? dateFmtFull.format(d) : dateFmtShort.format(d)
}

export function adminFetchMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: unknown }).data
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message?: unknown }).message
      if (typeof m === 'string' && m.length > 0) return m
    }
  }
  if (e instanceof Error && e.message) return e.message
  return 'تعذّر إتمام العملية — حاول مرة أخرى'
}
