import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import SegmentedControl from '../../components/ui/SegmentedControl'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../state/AuthProvider'
import { useCreatePrescription, useDeletePrescription, useMedicines, usePatients, usePrescriptions, useUpdatePrescription } from '../../hooks/useData'
import type { Prescription, PrescriptionCreate, PrescriptionUpdate } from '../../lib/types'
import PrescriptionFormModal from './PrescriptionFormModal'
import PrescriptionsTable from './PrescriptionsTable'

type StatusFilter = 'all' | 'Pending' | 'Filled' | 'Partially Filled' | 'Cancelled'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Filled', label: 'Filled' },
  { value: 'Partially Filled', label: 'Partial' },
  { value: 'Cancelled', label: 'Cancelled' },
]

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="panel rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
    </div>
  )
}

export default function PrescriptionsPage() {
  const { push } = useToast()
  const { isManager } = useAuth()
  const { data, isLoading, isError, error, refetch } = usePrescriptions()
  const { data: patients } = usePatients(isManager)
  const { data: medicines } = useMedicines()

  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Prescription | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null)

  const createMut = useCreatePrescription()
  const updateMut = useUpdatePrescription()
  const deleteMut = useDeletePrescription()

  const prescriptions = data ?? []
  const patientList = patients ?? []
  const medicineList = medicines ?? []

  const filtered = (() => {
    const q = search.trim().toLowerCase()
    return prescriptions.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (!q) return true
      return [p.prescription_number, p.doctor_name, p.diagnosis, p.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  })()

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter((p) => p.status === 'Pending').length,
    filled: prescriptions.filter((p) => p.status === 'Filled').length,
    cancelled: prescriptions.filter((p) => p.status === 'Cancelled').length,
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(p: Prescription) {
    setEditing(p)
    setFormOpen(true)
  }

  function handleSubmit(payload: PrescriptionCreate | PrescriptionUpdate) {
    if (editing) {
      updateMut.mutate(
        { id: editing.id, payload },
        {
          onSuccess: () => {
            push({ type: 'success', title: 'Prescription updated' })
            setFormOpen(false)
          },
          onError: (e) => push({ type: 'error', title: 'Could not update', message: (e as Error).message }),
        },
      )
    } else {
      createMut.mutate(payload as PrescriptionCreate, {
        onSuccess: (p) => {
          push({ type: 'success', title: 'Prescription created', message: p.prescription_number ?? undefined })
          setFormOpen(false)
        },
        onError: (e) => push({ type: 'error', title: 'Could not create', message: (e as Error).message }),
      })
    }
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        push({ type: 'success', title: 'Prescription deleted' })
        setDeleteTarget(null)
      },
      onError: (e) => {
        push({ type: 'error', title: 'Could not delete', message: (e as Error).message })
        setDeleteTarget(null)
      },
    })
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Clinical</p>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Prescriptions</h1>
          <p className="mt-1 text-sm text-muted">Track prescriptions, issuing doctors and dispensing status.</p>
        </div>
        {isManager && (
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            New prescription
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={String(stats.total)} hint="All prescriptions" />
        <StatCard label="Pending" value={String(stats.pending)} hint="Awaiting dispensing" />
        <StatCard label="Filled" value={String(stats.filled)} hint="Completed" />
        <StatCard label="Cancelled" value={String(stats.cancelled)} hint="Voided" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl ariaLabel="Filter by status" options={FILTERS} value={status} onChange={setStatus} size="sm" />
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Rx #, doctor, diagnosis…"
            aria-label="Search prescriptions"
            className="h-11 w-full rounded-xl2 border border-line/40 bg-white/70 px-4 text-sm text-ink outline-none transition focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(76,175,80,0.18)] dark:bg-white/5"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="panel space-y-2 rounded-2xl p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-3/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="panel rounded-2xl">
          <EmptyState
            title="Couldn't load prescriptions"
            description={(error as Error)?.message || 'Something went wrong.'}
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
              >
                Retry
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel rounded-2xl">
          <EmptyState
            title={search || status !== 'all' ? 'No matching prescriptions' : 'No prescriptions yet'}
            description={
              search || status !== 'all'
                ? 'Try adjusting your search or filter.'
                : isManager
                  ? 'Create the first prescription to get started.'
                  : 'Nothing has been prescribed yet.'
            }
            action={
              isManager && !search && status === 'all' ? (
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openAdd}>
                  New prescription
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <PrescriptionsTable
          data={filtered}
          patients={patientList}
          isManager={isManager}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <PrescriptionFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        prescription={editing}
        patients={patientList}
        medicines={medicineList}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete prescription"
        message={`This permanently removes ${deleteTarget?.prescription_number ?? 'this prescription'}${deleteTarget?.doctor_name ? ` (Dr. ${deleteTarget.doctor_name})` : ''}. This cannot be undone.`}
        confirmLabel="Delete prescription"
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
