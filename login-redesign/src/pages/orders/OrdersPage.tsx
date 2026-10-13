import { useMemo, useState } from 'react'
import { Check, Clock, PackageCheck, ShieldAlert, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../state/AuthProvider'
import { useApproveOrder, useCancelOrder, useOrders, useRejectOrder } from '../../hooks/useData'
import { formatCurrency, formatDateTime } from '../../lib/format'
import type { Order, OrderStatus } from '../../lib/types'

const STATUS_META: Record<OrderStatus, { label: string; tone: 'info' | 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  Pending: { label: 'Pending', tone: 'warn' },
  Approved: { label: 'Approved', tone: 'ok' },
  Rejected: { label: 'Rejected', tone: 'danger' },
  Cancelled: { label: 'Cancelled', tone: 'neutral' },
}

const STATUS_FILTERS: Array<OrderStatus | 'All'> = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled']

function StatusChip({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  return <Chip tone={meta.tone}>{meta.label}</Chip>
}

export default function OrdersPage() {
  const { push } = useToast()
  const { isManager } = useAuth()
  const { data, isLoading, isError, error, refetch } = useOrders()
  const approveMut = useApproveOrder()
  const rejectMut = useRejectOrder()
  const cancelMut = useCancelOrder()
  const [filter, setFilter] = useState<OrderStatus | 'All'>('All')

  const orders = useMemo(() => {
    const list = data ?? []
    return filter === 'All' ? list : list.filter((o) => o.status === filter)
  }, [data, filter])

  const pendingCount = useMemo(() => (data ?? []).filter((o) => o.status === 'Pending').length, [data])

  function handleApprove(o: Order) {
    approveMut.mutate(o.id, {
      onSuccess: (next) => {
        push({
          type: 'success',
          title: 'Order approved',
          message: `${next.order_number} billed · ${next.bill_number ?? ''} · invoice e-mailed.`,
        })
      },
      onError: (e: unknown) => push({ type: 'error', title: 'Could not approve', message: (e as Error).message }),
    })
  }

  function handleReject(o: Order) {
    rejectMut.mutate(o.id, {
      onSuccess: (next) => push({ type: 'info', title: 'Order rejected', message: next.order_number }),
      onError: (e: unknown) => push({ type: 'error', title: 'Could not reject', message: (e as Error).message }),
    })
  }

  function handleCancel(o: Order) {
    cancelMut.mutate(o.id, {
      onSuccess: (next) => push({ type: 'info', title: 'Order cancelled', message: next.order_number }),
      onError: (e: unknown) => push({ type: 'error', title: 'Could not cancel', message: (e as Error).message }),
    })
  }

  const busy =
    approveMut.isPending || rejectMut.isPending || cancelMut.isPending

  return (
    <div className="space-y-4">
      {isManager && pendingCount > 0 && (
        <div className="panel flex items-center gap-3 rounded-2xl border-l-4 border-amber-500 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
            <Clock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">
              {pendingCount} order{pendingCount === 1 ? '' : 's'} awaiting approval
            </p>
            <p className="text-xs text-muted">Approve to create the bill and e-mail the invoice to the patient.</p>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={
              filter === s
                ? 'rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition'
                : 'rounded-xl border border-line/30 bg-surface-2/60 px-3.5 py-2 text-sm font-semibold text-muted transition hover:text-ink'
            }
          >
            {s}
            {s === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-600">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="panel rounded-3xl">
          <EmptyState
            title="Couldn't load orders"
            description={(error as Error)?.message || 'Something went wrong talking to the server.'}
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
              >
                Try again
              </button>
            }
          />
        </div>
      ) : isLoading ? (
        <div className="panel space-y-2 rounded-2xl p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="panel rounded-2xl">
          <EmptyState
            title={filter === 'All' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
description={
                isManager
                  ? 'Orders customers place appear here for you to approve or reject.'
                  : 'Go to Medicines, add items to your cart, and place an order — it will show up here.'
              }
          />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((o) => {
            const meta = STATUS_META[o.status]
            const total = o.items.reduce((s, it) => s + it.subtotal, 0)
            return (
              <div key={o.id} className="panel flex flex-col gap-3 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold text-ink">{o.order_number}</p>
                    <p className="text-xs text-muted">{formatDateTime(o.created_at)}</p>
                  </div>
                  <StatusChip status={o.status} />
                </div>

                {isManager && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <ShieldAlert className="h-3.5 w-3.5 text-muted" />
                    {o.patient_name || 'Unknown patient'}
                  </p>
                )}

                <ul className="space-y-1.5 rounded-xl border border-line/20 bg-surface/50 p-3">
                  {o.items.map((it) => (
                    <li key={it.id ?? it.medicine_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate text-ink-soft">
                        {it.medicine_name} <span className="text-muted">× {it.quantity}</span>
                      </span>
                      <span className="tabular shrink-0 font-semibold text-ink">{formatCurrency(it.subtotal)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between border-t border-line/20 pt-1.5 text-sm font-bold text-ink">
                    <span>Total</span>
                    <span className="tabular">{formatCurrency(total)}</span>
                  </li>
                </ul>

                {o.bill_number && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                    <PackageCheck className="h-4 w-4" />
                    {o.bill_number}
                  </p>
                )}

                {o.status === 'Pending' && (
                  <div className="mt-auto flex gap-2">
                    {isManager ? (
                      <>
                        <Button variant="primary" className="flex-1" loading={busy} onClick={() => handleApprove(o)}>
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="ghost" className="flex-none text-danger" loading={busy} onClick={() => handleReject(o)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="secondary" className="w-full text-danger" loading={busy} onClick={() => handleCancel(o)}>
                        Cancel order
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}