import { Eye, MoreVertical, Pencil, Pill, Plus, Trash2 } from 'lucide-react'
import Chip from '../../components/ui/Chip'
import Dropdown, { DropdownItem, DropdownSeparator } from '../../components/ui/Dropdown'
import StockBar from '../../components/ui/StockBar'
import TiltCard from '../../components/ui/Card'
import { useCart } from '../../state/Cart'
import { expiryLevel, formatCurrency, formatDate, stockLevel } from '../../lib/format'
import type { Medicine } from '../../lib/types'

interface MedicineGridProps {
  data: Medicine[]
  isManager: boolean
  onView: (m: Medicine) => void
  onEdit: (m: Medicine) => void
  onDelete: (m: Medicine) => void
}

function AddToCartButton({ m }: { m: Medicine }) {
  const { add, setOpen } = useCart()
  const buyable = m.quantity_in_stock > 0 && expiryLevel(m) !== 'expired'
  return (
    <button
      type="button"
      disabled={!buyable}
      onClick={() => {
        add(m)
        setOpen(true)
      }}
      className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted"
    >
      <Plus className="h-3.5 w-3.5" />
      Add
    </button>
  )
}

export default function MedicineGrid({ data, isManager, onView, onEdit, onDelete }: MedicineGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((m) => {
        const level = stockLevel(m)
        const exp = expiryLevel(m)
        return (
          <TiltCard key={m.id} max={4} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => onView(m)} className="min-w-0 flex-1 text-left outline-none">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-600">
                    <Pill className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{m.name}</p>
                    <p className="truncate text-[11px] text-muted">{m.medicine_code}</p>
                  </div>
                </div>
              </button>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    aria-label={`Actions for ${m.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                }
              >
                <DropdownItem icon={<Eye className="h-4 w-4" />} onSelect={() => onView(m)}>
                  View details
                </DropdownItem>
                {isManager && (
                  <>
                    <DropdownItem icon={<Pencil className="h-4 w-4" />} onSelect={() => onEdit(m)}>
                      Edit
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onSelect={() => onDelete(m)}>
                      Delete
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </div>

            <p className="mt-3 text-xs text-muted">
              {[m.manufacturer, m.dosage_form, m.strength].filter(Boolean).join(' · ') || 'No details'}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <span className="tabular font-display text-lg font-bold text-ink">
                {formatCurrency(m.unit_price)}
              </span>
              {level === 'out' ? (
                <Chip tone="danger">Out</Chip>
              ) : level === 'low' ? (
                <Chip tone="warn">Low</Chip>
              ) : (
                <Chip tone="ok">In stock</Chip>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <StockBar value={m.quantity_in_stock} max={m.maximum_stock_level ?? 100} level={level} />
              <Chip tone={exp === 'expired' ? 'danger' : exp === 'expiring' ? 'warn' : 'neutral'}>
                {exp === 'expired' ? 'Expired' : `exp ${formatDate(m.expiry_date)}`}
              </Chip>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <AddToCartButton m={m} />
              <span className="text-[11px] text-muted">
                {m.quantity_in_stock > 0 ? `${m.quantity_in_stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </TiltCard>
        )
      })}
    </div>
  )
}
