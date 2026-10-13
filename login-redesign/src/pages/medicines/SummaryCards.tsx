import { CalendarClock, IndianRupee, PackageX, Pill, TriangleAlert } from 'lucide-react'
import TiltCard from '../../components/ui/Card'
import AnimatedNumber from '../../components/ui/AnimatedNumber'
import Sparkline from '../../components/ui/Sparkline'
import { cn } from '../../lib/cn'
import { expiryLevel, formatNumber, stockLevel } from '../../lib/format'
import type { Medicine } from '../../lib/types'

export type MedicineFilter = 'all' | 'in' | 'low' | 'out' | 'expiring' | 'expired'

interface SummaryCardsProps {
  medicines: Medicine[]
  active: MedicineFilter
  onSelect: (f: MedicineFilter) => void
}

function countFor(medicines: Medicine[], f: MedicineFilter): number {
  switch (f) {
    case 'in':
      return medicines.filter((m) => stockLevel(m) === 'healthy').length
    case 'low':
      return medicines.filter((m) => stockLevel(m) === 'low').length
    case 'out':
      return medicines.filter((m) => stockLevel(m) === 'out').length
    case 'expiring':
      return medicines.filter((m) => expiryLevel(m) === 'expiring').length
    case 'expired':
      return medicines.filter((m) => expiryLevel(m) === 'expired').length
    default:
      return medicines.length
  }
}

export default function SummaryCards({ medicines, active, onSelect }: SummaryCardsProps) {
  const inventoryValue = medicines.reduce((s, m) => s + m.unit_price * m.quantity_in_stock, 0)

  const cards: Array<{
    key: MedicineFilter | 'value'
    filter: MedicineFilter | null
    label: string
    value: number
    icon: React.ReactNode
    tone: 'brand' | 'warning' | 'danger' | 'info'
    trend: number[]
    format?: (n: number) => string
  }> = [
    { key: 'all', filter: 'all', label: 'Total medicines', value: medicines.length, icon: <Pill className="h-5 w-5" />, tone: 'brand', trend: [6, 7, 8, 9, 9, 10, medicines.length] },
    { key: 'low', filter: 'low', label: 'Low stock', value: countFor(medicines, 'low'), icon: <TriangleAlert className="h-5 w-5" />, tone: 'warning', trend: [4, 3, 3, 2, 3, 3, countFor(medicines, 'low')] },
    { key: 'out', filter: 'out', label: 'Out of stock', value: countFor(medicines, 'out'), icon: <PackageX className="h-5 w-5" />, tone: 'danger', trend: [1, 1, 2, 1, 1, 1, countFor(medicines, 'out')] },
    { key: 'expiring', filter: 'expiring', label: 'Expiring (90d)', value: countFor(medicines, 'expiring'), icon: <CalendarClock className="h-5 w-5" />, tone: 'info', trend: [1, 2, 2, 3, 2, 2, countFor(medicines, 'expiring')] },
    { key: 'value', filter: null, label: 'Inventory value', value: inventoryValue, icon: <IndianRupee className="h-5 w-5" />, tone: 'brand', trend: [8, 9, 10, 11, 12, 12, 13], format: (n) => `₹${formatNumber(Math.round(n))}` },
  ]

  const toneClass: Record<string, string> = {
    brand: 'bg-brand-500/12 text-brand-600',
    warning: 'bg-warning/12 text-warning',
    danger: 'bg-danger/12 text-danger',
    info: 'bg-info/12 text-info',
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map((c) => {
        const isActive = c.filter !== null && active === c.filter
        const clickable = c.filter !== null
        return (
          <TiltCard key={c.key} max={5} className={cn('p-4', isActive && 'ring-2 ring-brand-500/50')}>
            <button
              type="button"
              onClick={() => c.filter && onSelect(isActive ? 'all' : c.filter)}
              disabled={!clickable}
              aria-pressed={isActive}
              className={cn(
                'w-full text-left',
                clickable ? 'cursor-pointer' : 'cursor-default',
                'outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('grid h-9 w-9 place-items-center rounded-xl', toneClass[c.tone])}>{c.icon}</span>
                <Sparkline data={c.trend} tone={c.tone} width={72} height={26} />
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{c.label}</p>
              <p className="mt-0.5 font-display text-xl font-bold text-ink">
                <AnimatedNumber value={c.value} format={c.format} />
              </p>
            </button>
          </TiltCard>
        )
      })}
    </div>
  )
}
