import { Pill, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Drawer from '../../components/ui/Drawer'
import StockBar from '../../components/ui/StockBar'
import { expiryLevel, formatCurrency, formatDate, stockLevel } from '../../lib/format'
import type { Medicine } from '../../lib/types'

interface MedicineDrawerProps {
  medicine: Medicine | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isManager: boolean
  onEdit: (m: Medicine) => void
  onDelete: (m: Medicine) => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

export default function MedicineDrawer({
  medicine,
  open,
  onOpenChange,
  isManager,
  onEdit,
  onDelete,
}: MedicineDrawerProps) {
  const m = medicine
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={m?.name ?? 'Medicine'} description={m?.medicine_code}>
      {medicine && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={stockLevel(medicine) === 'out' ? 'danger' : stockLevel(medicine) === 'low' ? 'warn' : 'ok'}>
              {stockLevel(medicine) === 'out' ? 'Out of stock' : stockLevel(medicine) === 'low' ? 'Low stock' : 'In stock'}
            </Chip>
            <Chip tone={expiryLevel(medicine) === 'expired' ? 'danger' : expiryLevel(medicine) === 'expiring' ? 'warn' : 'neutral'}>
              {expiryLevel(medicine) === 'expired' ? 'Expired' : expiryLevel(medicine) === 'expiring' ? 'Expiring soon' : 'Shelf life ok'}
            </Chip>
            <Chip tone={medicine.is_active ? 'ok' : 'neutral'}>{medicine.is_active ? 'Active' : 'Inactive'}</Chip>
          </div>

          <div className="panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Selling price</p>
                <p className="font-display text-2xl font-bold text-ink">{formatCurrency(medicine.unit_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted">Cost</p>
                <p className="text-sm font-semibold text-ink-soft">{formatCurrency(medicine.purchase_price)}</p>
              </div>
            </div>
            <div className="mt-3">
              <StockBar
                value={medicine.quantity_in_stock}
                max={medicine.maximum_stock_level ?? 100}
                level={stockLevel(medicine)}
                className="w-full"
              />
            </div>
          </div>

          <div className="divide-y divide-line/15">
            <Row label="Generic name" value={medicine.generic_name || '—'} />
            <Row label="Manufacturer" value={medicine.manufacturer || '—'} />
            <Row label="Dosage form" value={medicine.dosage_form || '—'} />
            <Row label="Strength" value={medicine.strength || '—'} />
            <Row label="Batch no." value={medicine.batch_number || '—'} />
            <Row label="Manufactured" value={formatDate(medicine.manufacture_date)} />
            <Row
              label="Expiry"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {formatDate(medicine.expiry_date)}
                  {expiryLevel(medicine) !== 'ok' && (
                    <Chip tone={expiryLevel(medicine) === 'expired' ? 'danger' : 'warn'}>
                      {expiryLevel(medicine) === 'expired' ? 'expired' : 'soon'}
                    </Chip>
                  )}
                </span>
              }
            />
            <Row label="Min stock" value={medicine.minimum_stock_level} />
            <Row label="Max stock" value={medicine.maximum_stock_level ?? '—'} />
            <Row
              label="Storage"
              value={
                medicine.storage_location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-muted" />
                    {medicine.storage_location}
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-surface-2/60 p-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden>
                <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M3 8h14M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Created {formatDate(medicine.created_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Updated {formatDate(medicine.updated_at)}
            </span>
          </div>

          {isManager && (
            <div className="flex items-center gap-3 pt-1">
              <Button variant="primary" className="flex-1" leftIcon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="none"><path d="M13.5 3.5l3 3L7 16H4v-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>} onClick={() => onEdit(medicine)}>
                Edit
              </Button>
              <Button variant="ghost" className="text-danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => onDelete(medicine)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}
