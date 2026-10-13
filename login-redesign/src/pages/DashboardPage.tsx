import { Link } from 'react-router-dom'
import { ArrowUpRight, IndianRupee, PackageX, Pill, TriangleAlert } from 'lucide-react'
import TiltCard from '../components/ui/Card'
import Sparkline from '../components/ui/Sparkline'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import Chip from '../components/ui/Chip'
import Skeleton from '../components/ui/Skeleton'
import { useBills, useMedicines } from '../hooks/useData'
import { expiryLevel, formatDate, formatNumber, stockLevel } from '../lib/format'
import type { Medicine } from '../lib/types'

function Stat({
  label,
  value,
  tone,
  icon,
  trend,
  format,
}: {
  label: string
  value: number
  tone: 'brand' | 'warning' | 'danger' | 'info'
  icon: React.ReactNode
  trend: number[]
  format?: (n: number) => string
}) {
  const iconTone = {
    brand: 'bg-brand-500/12 text-brand-600',
    warning: 'bg-warning/12 text-warning',
    danger: 'bg-danger/12 text-danger',
    info: 'bg-info/12 text-info',
  }[tone]
  return (
    <TiltCard className="p-5" max={5}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            <AnimatedNumber value={value} format={format ?? ((n) => formatNumber(Math.round(n)))} />
          </p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${iconTone}`}>{icon}</span>
      </div>
      <div className="mt-3">
        <Sparkline data={trend} tone={tone} width={200} height={34} className="w-full" />
      </div>
    </TiltCard>
  )
}

export default function DashboardPage() {
  const { data: medicines, isLoading } = useMedicines()
  const { data: bills = [] } = useBills()

  const revenue = (bills ?? []).reduce((s, b) => s + Number(b.net_amount || 0), 0)

  const recent = (bills ?? []).slice(0, 5)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Good to see you 👋</h2>
          <p className="text-sm text-muted">Here's how your pharmacy is doing today.</p>
        </div>
        <Link
          to="/billing"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
        >
          New bill <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Medicines" value={medicines ? medicines.length : 0} tone="brand" icon={<Pill className="h-5 w-5" />} trend={[8, 9, 9, 10, 10, 11, 12]} />
        <Stat label="Low stock" value={medicines ? medicines.filter((m) => stockLevel(m) !== 'healthy').length : 0} tone="warning" icon={<TriangleAlert className="h-5 w-5" />} trend={[3, 2, 3, 4, 3, 4, 4]} />
        <Stat label="Out of stock" value={medicines ? medicines.filter((m) => stockLevel(m) === 'out').length : 0} tone="danger" icon={<PackageX className="h-5 w-5" />} trend={[1, 1, 0, 1, 1, 1, 1]} />
        <Stat
          label="Revenue (bills)"
          value={revenue}
          tone="info"
          icon={<IndianRupee className="h-5 w-5" />}
          trend={[1200, 1800, 1500, 2200, 2600, 2400, 3100]}
          format={(n) => `₹${formatNumber(Math.round(n))}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel rounded-3xl p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-ink">Recent bills</h3>
            <Link to="/billing" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {!bills ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No bills yet.</p>
          ) : (
            <ul className="divide-y divide-line/15">
              {recent.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{b.bill_number}</p>
                    <p className="text-xs text-muted">
                      {b.patient_name ?? 'Walk-in'} · {formatDate(b.sale_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-bold text-ink">₹{formatNumber(Number(b.net_amount))}</p>
                    <Chip tone={b.payment_status === 'Paid' ? 'ok' : 'warn'}>{b.payment_status}</Chip>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel rounded-3xl p-5">
          <h3 className="mb-3 font-display text-lg font-bold text-ink">Attention needed</h3>
          <AlertList items={medicines ?? []} />
        </div>
      </div>
    </div>
  )
}

function AlertList({ items }: { items: Medicine[] }) {
  const alerts = items
    .filter((m) => stockLevel(m) === 'out' || expiryLevel(m) !== 'ok')
    .slice(0, 6)
  if (alerts.length === 0) return <p className="py-6 text-center text-sm text-muted">Everything looks healthy.</p>
  return (
    <ul className="space-y-2">
      {alerts.map((m) => {
        const out = stockLevel(m) === 'out'
        return (
          <li key={m.id} className="flex items-center justify-between rounded-xl bg-surface-2/60 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
              <span className="block text-[11px] text-muted">{m.medicine_code}</span>
            </span>
            <Chip tone={out ? 'danger' : 'warn'}>{out ? 'Out' : 'Expiring'}</Chip>
          </li>
        )
      })}
    </ul>
  )
}
