import type { Medicine, StatusLevel } from './types'

/* ---------------------------------------------------------------- numbers */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return inr.format(n)
}

/** Compact ₹ for dense cards (₹1.2L, ₹4.5k). */
export function formatCompactINR(value: number): string {
  const v = Math.abs(value)
  if (v >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`
  if (value >= 1_00_000) return `₹${(value / 100000).toFixed(2)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`
  return `₹${value.toFixed(0)}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

/* ---- dates ---- */

/** Human "12 Mar 2027" from any ISO-ish string. */
export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Whole days from today (negative = in the past). */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - start.getTime()) / 86_400_000)
}

/** "in 24 days" / "today" / "12 days ago". */
export function relativeDays(value?: string | null): string {
  const days = daysUntil(value)
  if (days === null) return '—'
  if (days === 0) return 'today'
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`
  const ago = Math.abs(days)
  return `${ago} day${ago === 1 ? '' : 's'} ago`
}

/** yyyy-mm-dd suitable for <input type="date"> and the backend. */
export function toDateInput(value?: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/* ---- business status ---- */

export const LOW_STOCK_THRESHOLD = 20
export const EXPIRING_SOON_DAYS = 90
export const EXPIRED_DAYS = 0
/** Near-expiry warning (can still be sold but flagged). */
export const NEAR_EXPIRY_DAYS = 30

export function stockLevel(m: Pick<Medicine, 'quantity_in_stock'>): 'out' | 'low' | 'healthy' {
  if (m.quantity_in_stock <= 0) return 'out'
  if (m.quantity_in_stock <= LOW_STOCK_THRESHOLD) return 'low'
  return 'healthy'
}

export function expiryLevel(m: Pick<Medicine, 'expiry_date'>): 'expired' | 'expiring' | 'ok' {
  const days = daysUntil(m.expiry_date)
  if (days === null) return 'ok'
  if (days < EXPIRED_DAYS) return 'expired'
  if (days <= EXPIRING_SOON_DAYS) return 'expiring'
  return 'ok'
}

export function statusOf(m: Medicine): StatusLevel {
  const exp = expiryLevel(m)
  if (exp === 'expired') return 'expired'
  const stock = stockLevel(m)
  if (stock === 'out') return 'out'
  if (exp === 'expiring') return 'expiring'
  if (stock === 'low') return 'low'
  return 'healthy'
}

/* ---- misc ---- */

export function initials(first?: string | null, last?: string | null, fallback = 'HP'): string {
  const a = (first ?? '').trim()[0] ?? ''
  const b = (last ?? '').trim()[0] ?? ''
  const out = `${a}${b}`.toUpperCase()
  return out || fallback
}

/** Full name from a Patient-like object. */
export function patientName(p?: { first_name?: string; last_name?: string } | null): string {
  if (!p) return ''
  return `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
}

export function stockPercent(m: Pick<Medicine, 'quantity_in_stock' | 'maximum_stock_level'>): number {
  const max = m.maximum_stock_level && m.maximum_stock_level > 0 ? m.maximum_stock_level : 100
  return Math.max(0, Math.min(100, Math.round((m.quantity_in_stock / max) * 100)))
}

/** Escape a value for safe CSV embedding. */
export function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
