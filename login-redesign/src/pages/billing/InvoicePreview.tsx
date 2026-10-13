import { Mail, Printer } from 'lucide-react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../../lib/format'
import type { Sale } from '../../lib/types'

interface InvoicePreviewProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canEmail: boolean
  sending: boolean
  onEmail: (sale: Sale) => void
}

export default function InvoicePreview({ sale, open, onOpenChange, canEmail, sending, onEmail }: InvoicePreviewProps) {
  if (!sale) return null
  const items = sale.items ?? []

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Invoice"
      description={sale.bill_number}
      size="lg"
      footer={
        <>
          <Button variant="ghost" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print
          </Button>
          {canEmail && (
            <Button
              variant="secondary"
              leftIcon={<Mail className="h-4 w-4" />}
              loading={sending}
              onClick={() => onEmail(sale)}
            >
              Email bill
            </Button>
          )}
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </>
      }
    >
      <div className="print-area space-y-4">
        <div className="flex items-start justify-between border-b border-line/20 pb-4">
          <div>
            <p className="font-display text-lg font-bold text-ink">PharmaMS</p>
            <p className="text-xs text-muted">Pharmacy invoice</p>
          </div>
          <div className="text-right">
            <p className="tabular text-sm font-bold text-ink">{sale.bill_number}</p>
            <p className="text-xs text-muted">{formatDateTime(sale.sale_date)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Billed to</p>
            <p className="text-sm font-semibold text-ink">{sale.patient_name || 'Walk-in customer'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted">Payment</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <Chip tone={sale.payment_status === 'Paid' ? 'ok' : 'warn'}>{sale.payment_status}</Chip>
              <span className="text-sm font-semibold text-ink">{sale.payment_method}</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line/20">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Item</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 text-right font-semibold">Price</th>
                <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted">
                    No line items.
                  </td>
                </tr>
              )}
              {items.map((it, i) => (
                <tr key={it.id ?? i} className="border-t border-line/10">
                  <td className="px-3 py-2 text-ink">{it.medicine_name ?? 'Item'}</td>
                  <td className="tabular px-3 py-2 text-right text-ink-soft">{it.quantity}</td>
                  <td className="tabular px-3 py-2 text-right text-ink-soft">{formatCurrency(it.unit_price)}</td>
                  <td className="tabular px-3 py-2 text-right font-semibold text-ink">
                    {formatCurrency(it.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="tabular text-ink-soft">{formatCurrency(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Discount</span>
            <span className="tabular text-ink-soft">−{formatCurrency(sale.discount_amount)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Tax</span>
            <span className="tabular text-ink-soft">{formatCurrency(sale.tax_amount)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-line/20 pt-2 text-base font-bold text-ink">
            <span>Total</span>
            <span className="tabular">{formatCurrency(sale.net_amount)}</span>
          </div>
        </div>

        {sale.notes && <p className="rounded-xl bg-surface-2/60 p-3 text-xs text-muted">Note: {sale.notes}</p>}
      </div>
    </Modal>
  )
}
