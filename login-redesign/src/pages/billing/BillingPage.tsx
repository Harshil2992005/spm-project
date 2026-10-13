import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import SegmentedControl from '../../components/ui/SegmentedControl'
import Skeleton from '../../components/ui/Skeleton'
import { Input, Textarea } from '../../components/ui/Input'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../state/AuthProvider'
import { useCreateBill, useMedicines, usePatients, useSendBillEmail } from '../../hooks/useData'
import { formatCurrency, patientName, stockLevel } from '../../lib/format'
import type { Medicine, Sale, SaleCreateItem } from '../../lib/types'
import InvoicePreview from './InvoicePreview'

type PayMethod = 'Cash' | 'Card' | 'UPI' | 'Insurance'

interface CartLine {
  medicine: Medicine
  quantity: number
}

export default function BillingPage() {
  const { push } = useToast()
  const { isManager, user } = useAuth()
  const { data: medicines, isLoading: loadingMeds } = useMedicines()
  const { data: patients } = usePatients()
  const createBill = useCreateBill()
  const sendEmail = useSendBillEmail()

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [patientId, setPatientId] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('Cash')
  const [discount, setDiscount] = useState(0)
  const [taxPct, setTaxPct] = useState(5)
  const [notes, setNotes] = useState('')
  const [invoice, setInvoice] = useState<Sale | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  // Default the patient selector to the first patient once loaded.
  useEffect(() => {
    if (!patientId && patients && patients.length > 0) setPatientId(patients[0].id)
  }, [patients, patientId])

  const available = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (medicines ?? [])
      .filter((m) => m.is_active && m.quantity_in_stock > 0)
      .filter((m) =>
        !q
          ? true
          : m.name.toLowerCase().includes(q) ||
            m.medicine_code.toLowerCase().includes(q) ||
            (m.generic_name ?? '').toLowerCase().includes(q),
      )
      .slice(0, 60)
  }, [medicines, search])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.medicine.unit_price * l.quantity, 0)
    const taxAmount = Math.round(subtotal * (taxPct / 100) * 100) / 100
    const discountAmount = Math.min(discount || 0, subtotal)
    const netAmount = Math.max(0, subtotal - discountAmount + taxAmount)
    return { subtotal, taxAmount, discountAmount, netAmount }
  }, [cart, discount, taxPct])

  function addToCart(m: Medicine) {
    if (stockLevel(m) === 'out') return
    setCart((prev) => {
      const found = prev.find((l) => l.medicine.id === m.id)
      if (found) {
        if (found.quantity >= m.quantity_in_stock) return prev
        return prev.map((l) => (l.medicine.id === m.id ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [...prev, { medicine: m, quantity: 1 }]
    })
  }

  function setQty(id: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.medicine.id === id
            ? { ...l, quantity: Math.max(0, Math.min(qty, l.medicine.quantity_in_stock)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.medicine.id !== id))
  }

  function clearCart() {
    setCart([])
    setDiscount(0)
  }

  function saveBill() {
    if (cart.length === 0) return
    if (!user) return
    const items: SaleCreateItem[] = cart.map((l) => ({
      medicine_id: l.medicine.id,
      quantity: l.quantity,
      unit_price: l.medicine.unit_price,
      subtotal: Math.round(l.medicine.unit_price * l.quantity * 100) / 100,
    }))
    const payload = {
      patient_id: selectedPatientId,
      cashier_id: user.id,
      items,
      total_amount: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      net_amount: totals.netAmount,
      payment_method: payMethod,
      payment_status: 'Paid',
      notes: notes.trim() || null,
    }
    createBill.mutate(payload, {
      onSuccess: (sale) => {
        push({ type: 'success', title: 'Bill created', message: `${sale.bill_number} · ${formatCurrency(sale.net_amount)}` })
        setInvoice(sale)
        setInvoiceOpen(true)
        clearCart()
      },
      onError: (e: unknown) => {
        push({ type: 'error', title: 'Could not create bill', message: (e as Error).message })
      },
    })
  }

  function emailBill(sale: Sale) {
    sendEmail.mutate(sale.id, {
      onSuccess: (r) => push({ type: 'success', title: 'Bill emailed', message: r.message || 'Invoice sent to the patient.' }),
      onError: (e: unknown) => push({ type: 'error', title: 'Email failed', message: (e as Error).message }),
    })
  }

  const patientList = patients ?? []
  const selectedPatientId = patientId || patientList[0]?.id || ''
  const selectedPatient = patientList.find((p) => p.id === selectedPatientId)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(320px,380px)]">
      {/* Picker */}
      <div className="space-y-3">
        <div className="panel rounded-2xl p-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines to add…"
              aria-label="Search medicines"
              className="h-11 w-full rounded-xl border border-line/40 bg-surface/70 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:bg-white/5"
            />
          </div>
        </div>

        <div className="panel rounded-2xl p-3">
          {loadingMeds ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : available.length === 0 ? (
            <EmptyState title="No medicines found" description="Try a different search term." />
          ) : (
            <div className="grid max-h-[62vh] gap-2 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-2">
              {available.map((m) => {
                const inCart = cart.find((l) => l.medicine.id === m.id)
                const remaining = m.quantity_in_stock - (inCart?.quantity ?? 0)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => addToCart(m)}
                    disabled={remaining <= 0}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line/25 bg-surface/60 p-3 text-left transition hover:border-brand-500/50 hover:bg-brand-500/5 disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {m.medicine_code} · stock {m.quantity_in_stock}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="tabular text-sm font-bold text-brand-600">{formatCurrency(m.unit_price)}</span>
                      {inCart && <span className="text-[11px] text-muted">{inCart.quantity} in cart</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="space-y-3 lg:sticky lg:top-3 lg:self-start">
        <div className="panel rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-bold text-ink">
              <svg className="h-4 w-4 text-brand-600" viewBox="0 0 20 20" fill="none">
                <path d="M4 5h2l1.5 9H15l1.5-6H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="17" r="1" fill="currentColor" />
                <circle cx="14" cy="17" r="1" fill="currentColor" />
              </svg>
              Cart
            </h3>
            {cart.length > 0 && (
              <button type="button" onClick={clearCart} className="text-xs font-semibold text-danger hover:underline">
                Clear
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Add medicines from the list to start a bill.</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.medicine.id} className="rounded-xl border border-line/20 bg-surface/60 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{l.medicine.name}</p>
                      <p className="tabular text-[11px] text-muted">{formatCurrency(l.medicine.unit_price)} each</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(l.medicine.id)}
                      aria-label={`Remove ${l.medicine.name}`}
                      className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                        <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-lg border border-line/30">
                      <button
                        type="button"
                        onClick={() => setQty(l.medicine.id, l.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="grid h-7 w-7 place-items-center text-muted hover:text-ink"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none"><path d="M5 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      </button>
                      <span className="tabular w-8 text-center text-sm font-semibold text-ink">{l.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQty(l.medicine.id, l.quantity + 1)}
                        disabled={l.quantity >= l.medicine.quantity_in_stock}
                        aria-label="Increase quantity"
                        className="grid h-7 w-7 place-items-center text-muted hover:text-ink disabled:opacity-40"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none"><path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                    <span className="tabular text-sm font-bold text-ink">
                      {formatCurrency(l.medicine.unit_price * l.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel space-y-3 rounded-2xl p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">Patient</span>
            {patientList.length === 0 ? (
              <p className="rounded-xl bg-warning/10 p-3 text-xs text-warning">
                No patients yet. A bill needs a patient.
              </p>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="h-11 w-full rounded-xl border border-line/40 bg-surface/70 px-3 text-sm text-ink outline-none focus:border-brand-500 dark:bg-white/5"
              >
                {patientList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {patientName(p)} · {p.patient_id}
                  </option>
                ))}
              </select>
            )}
          </label>

          <SegmentedControl<PayMethod>
            ariaLabel="Payment method"
            size="sm"
            value={payMethod}
            onChange={setPayMethod}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Card' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Insurance', label: 'Insurance' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="discount"
              label="Discount (₹)"
              type="number"
              min={0}
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
            <Input
              id="tax"
              label="Tax (%)"
              type="number"
              min={0}
              step="0.5"
              value={taxPct}
              onChange={(e) => setTaxPct(Number(e.target.value) || 0)}
            />
          </div>

          <Textarea
            id="notes"
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[64px]"
          />

          <div className="space-y-1.5 border-t border-line/20 pt-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="tabular text-ink-soft">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Discount</span>
              <span className="tabular text-ink-soft">−{formatCurrency(totals.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax ({taxPct}%)</span>
              <span className="tabular text-ink-soft">{formatCurrency(totals.taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 text-lg font-bold text-ink">
              <span>Total</span>
              <span className="tabular">{formatCurrency(totals.netAmount)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={createBill.isPending}
            disabled={cart.length === 0 || !selectedPatientId}
            onClick={saveBill}
          >
            Create bill
          </Button>
        </div>
      </div>

      <InvoicePreview
        sale={invoice}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        canEmail={isManager}
        sending={sendEmail.isPending}
        onEmail={emailBill}
      />
    </div>
  )
}
