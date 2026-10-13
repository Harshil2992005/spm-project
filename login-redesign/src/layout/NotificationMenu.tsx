import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, CalendarClock, PackageX } from 'lucide-react'
import Dropdown, { DropdownLabel, DropdownSeparator } from '../components/ui/Dropdown'
import { useMedicines } from '../hooks/useData'
import { expiryLevel, relativeDays, stockLevel } from '../lib/format'
import type { Medicine } from '../lib/types'

function Row({ m, kind, note }: { m: Medicine; kind: 'warn' | 'danger' | 'info'; note: string }) {
  const tone =
    kind === 'danger' ? 'text-danger bg-danger/10' : kind === 'warn' ? 'text-warning bg-warning/10' : 'text-info bg-info/10'
  const Icon = kind === 'danger' ? PackageX : kind === 'warn' ? AlertTriangle : CalendarClock
  return (
    <Link
      to={`/medicines?filter=${kind === 'info' ? 'expiring' : kind === 'danger' ? 'out' : 'low'}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-brand-500/8"
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
        <span className="block truncate text-[11px] text-muted">{note}</span>
      </span>
      <span className="chip chip-neutral">{m.medicine_code}</span>
    </Link>
  )
}

export default function NotificationMenu() {
  const { data: medicines = [] } = useMedicines()

  const out = medicines.filter((m) => stockLevel(m) === 'out')
  const low = medicines.filter((m) => stockLevel(m) === 'low')
  const expiring = medicines.filter((m) => expiryLevel(m) === 'expiring')
  const expired = medicines.filter((m) => expiryLevel(m) === 'expired')
  const count = out.length + low.length + expiring.length + expired.length
  const empty = count === 0

  return (
    <Dropdown
      className="w-[22rem] p-2"
      trigger={
        <button
          type="button"
          aria-label={`Notifications${count ? `, ${count} alerts` : ''}`}
          className="relative grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      }
    >
      <DropdownLabel>Alerts</DropdownLabel>
      <DropdownSeparator />
      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {out.length > 0 && (
          <div className="px-1 pb-1">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-danger">
              Out of stock ({out.length})
            </p>
            {out.slice(0, 3).map((m) => (
              <Row key={m.id} m={m} kind="danger" note="No units available" />
            ))}
          </div>
        )}
        {low.length > 0 && (
          <div className="px-1 pb-1">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-warning">
              Low stock ({low.length})
            </p>
            {low.slice(0, 3).map((m) => (
              <Row key={m.id} m={m} kind="warn" note={`${m.quantity_in_stock} left`} />
            ))}
          </div>
        )}
        {(() => {
          const exp = medicines.filter((m) => expiryLevel(m) !== 'ok')
          if (exp.length === 0) return null
          return (
            <div className="px-1 pb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-info">
                Expiry watch ({exp.length})
              </p>
              {exp.slice(0, 3).map((m) => (
                <Row key={m.id} m={m} kind="info" note={`Expires ${relativeDays(m.expiry_date)}`} />
              ))}
            </div>
          )
        })()}
        {out.length + low.length + medicines.filter((m) => expiryLevel(m) !== 'ok').length === 0 && (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-sm text-muted">You are all caught up.</p>
          </div>
        )}
      </div>
      <DropdownSeparator />
      <Link
        to="/medicines"
        className="block rounded-xl px-3 py-2 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-500/10"
      >
        View inventory
      </Link>
    </Dropdown>
  )
}
