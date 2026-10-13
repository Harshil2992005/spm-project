import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../state/AuthProvider'
import { useCreatePatient, useDeletePatient, usePatients, useUpdatePatient } from '../../hooks/useData'
import { patientName } from '../../lib/format'
import type { Patient, PatientCreate, PatientUpdate } from '../../lib/types'
import PatientFormModal from './PatientFormModal'
import PatientsTable from './PatientsTable'

function StatCard({ label, value, hint }: { title?: string; label: string; value: string; hint?: string }) {
  return (
    <div className="panel rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

export default function PatientsPage() {
  const { push } = useToast()
  const { isManager } = useAuth()
  const { data, isLoading, isError, error, refetch } = usePatients()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

  const createMut = useCreatePatient()
  const updateMut = useUpdatePatient()
  const deleteMut = useDeletePatient()

  const patients = data ?? []

  const filtered = (() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    return patients.filter((p) =>
      [p.patient_id, p.first_name, p.last_name, p.insurance_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  })()

  const stats = {
    total: patients.length,
    insured: patients.filter((p) => p.insurance_number || p.insurance_provider).length,
    reachable: patients.filter((p) => p.phone || p.email).length,
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(p: Patient) {
    setEditing(p)
    setFormOpen(true)
  }

  function handleSubmit(payload: PatientCreate | PatientUpdate) {
    if (editing) {
      updateMut.mutate(
        { id: editing.id, payload },
        {
          onSuccess: (p) => {
            push({ type: 'success', title: 'Patient updated', message: `${p.first_name} ${p.last_name}` })
            setFormOpen(false)
          },
          onError: (e) => push({ type: 'error', title: 'Could not update', message: (e as Error).message }),
        },
      )
    } else {
      createMut.mutate(payload as PatientCreate, {
        onSuccess: (p) => {
          push({ type: 'success', title: 'Patient added', message: `${p.first_name} ${p.last_name}` })
          setFormOpen(false)
        },
        onError: (e) => push({ type: 'error', title: 'Could not add patient', message: (e as Error).message }),
      })
    }
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        push({ type: 'success', title: 'Patient deleted', message: `${patientName(deleteTarget)} was removed.` })
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
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Records</p>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Patients</h1>
          <p className="mt-1 text-sm text-muted">Manage patient profiles, insurance and medical history.</p>
        </div>
        {isManager && (
          <Button variant="primary" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openAdd}>
            Add patient
          </Button>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total patients" value={String(stats.total)} hint="Registered records" />
        <StatCard label="Insured" value={String(stats.insured)} hint="With insurance on file" />
        <StatCard label="Reachable" value={String(stats.reachable)} hint="Phone or e-mail" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            aria-label="Search patients"
            className="h-11 w-full rounded-xl2 border border-line/40 bg-white/70 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(76,175,80,0.18)] dark:bg-white/5"
          />
        </div>
        <p className="text-xs text-muted">
          {filtered.length} of {patients.length} shown
        </p>
      </div>

      {isLoading ? (
        <div className="panel space-y-2 rounded-2xl p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-3/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="panel rounded-2xl">
          <EmptyState
            title="Couldn't load patients"
            description={(error as Error)?.message || 'This view requires Manager access.'}
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
            title={search ? 'No matching patients' : 'No patients yet'}
            description={search ? 'Try a different search term.' : isManager ? 'Add your first patient to get started.' : undefined}
            action={
              !search && isManager ? (
                <Button variant="primary" leftIcon={<UserPlus className="h-4 w-4" />} onClick={openAdd}>
                  Add patient
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <PatientsTable data={filtered} isManager={isManager} onEdit={openEdit} onDelete={setDeleteTarget} />
      )}

      <PatientFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        patient={editing}
        submitting={createMut.isPending || updateMut.isPending}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete patient"
        message={`This permanently removes ${patientName(deleteTarget) || 'this patient'} (${deleteTarget?.patient_id ?? ''}). This cannot be undone.`}
        confirmLabel="Delete patient"
        loading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
