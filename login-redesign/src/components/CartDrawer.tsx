import { ShoppingCart, Trash2, Plus, Minus, Info } from 'lucide-react'
import Drawer from './ui/Drawer'
import Button from './ui/Button'
import Chip from './ui/Chip'
import EmptyState from './ui/EmptyState'
import { useCart } from '../state/Cart'
import { useAuth } from '../state/AuthProvider'
import { useCreateOrder } from '../hooks/useData'
import { useToast } from './Toast'
import { formatCurrency } from '../lib/format'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { push } = useToast()
  const { lines, count, subtotal, open, setOpen, setQty, remove, clear } = useCart()
  const { isManager } = useAuth()
  const createOrder = useCreateOrder()

  function placeOrder() {
    if (lines.length === 0) return
    createOrder.mutate(
      { items: lines.map((l) => ({ medicine_id: l.medicine.id, quantity: l.quantity })) },
      {
        onSuccess: (order) => {
          push({
            type: 'success',
            title: 'Order placed',
            message: `${order.order_number} is pending manager approval.`,
          })
          clear()
          setOpen(false)
        },
        onError: (e: unknown) => {
          push({ type: 'error', title: 'Could not place order', message: (e as Error).message })
        },
      },
    )
  }

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title="Your cart"
      description={count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'Nothing added yet'}
      footer={
        lines.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="tabular text-lg font-bold text-ink">{formatCurrency(subtotal)}</span>
            </div>
            <Button variant="primary" size="lg" className="w-full" loading={createOrder.isPending} onClick={placeOrder}>
              Place order
            </Button>
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <Info className="h-3.5 w-3.5" />
              {isManager
                ? 'The bill is created when you approve this order.'
                : 'The pharmacy will review your order and e-mail the invoice on approval.'}
            </p>
          </div>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <EmptyState
          title="Cart is empty"
          description="Browse medicines and add what you need."
          action={
            <Link
              to="/medicines"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Browse medicines
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {lines.map((l) => (
            <li key={l.medicine.id} className="rounded-xl border border-line/20 bg-surface/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{l.medicine.name}</p>
                  <p className="tabular text-[11px] text-muted">
                    {formatCurrency(l.medicine.unit_price)} each
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.medicine.id)}
                  aria-label={`Remove ${l.medicine.name}`}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
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
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="tabular w-8 text-center text-sm font-semibold text-ink">{l.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQty(l.medicine.id, l.quantity + 1)}
                    disabled={l.quantity >= l.medicine.quantity_in_stock}
                    aria-label="Increase quantity"
                    className="grid h-7 w-7 place-items-center text-muted hover:text-ink disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="flex items-center gap-2">
                  <Chip tone={l.medicine.quantity_in_stock <= 0 ? 'danger' : 'neutral'}>
                    {l.medicine.quantity_in_stock} in stock
                  </Chip>
                  <span className="tabular text-sm font-bold text-ink">
                    {formatCurrency(l.medicine.unit_price * l.quantity)}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}