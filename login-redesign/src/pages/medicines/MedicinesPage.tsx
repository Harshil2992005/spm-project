import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/Toast'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import { useAuth } from '../../state/AuthProvider'
import { useLocalStorage } from '../../hooks/useUtils'
import { useCreateMedicine, useDeleteMedicine, useMedicines, useUpdateMedicine } from '../../hooks/useData'
import { csvCell, expiryLevel, formatDate, stockLevel } from '../../lib/format'
import type { Medicine, MedicineCreate, MedicineUpdate } from '../../lib/types'
import SummaryCards, { type MedicineFilter } from './SummaryCards'
import MedicineToolbar, { type MedicineView } from './MedicineToolbar'
import MedicineTable from './MedicineTable'
import MedicineGrid from './MedicineGrid'
import MedicineDrawer from './MedicineDrawer'
import MedicineFormModal from './MedicineFormModal'

const FILTER_VALUES: MedicineFilter[] = ['all', 'in', 'low', 'out', 'expiring', 'expired']

function matchesFilter(m: Medicine, f: MedicineFilter): boolean {
  switch (f) {
    case 'in':
      return stockLevel(m) === 'healthy'
    case 'low':
      return stockLevel(m) === 'low'
    case 'out':
      return stockLevel(m) === 'out'
    case 'expiring':
      return expiryLevel(m) === 'expiring'
    case 'expired':
      return expiryLevel(m) === 'expired'
    default:
      return true
  }
}

export default function MedicinesPage() {
  const { push } = useToast()
  const { isManager } = useAuth()
  const { data, isLoading, isError, error, refetch } = useMedicines()

  const [params, setParams] = useSearchParams()
  const initialFilter = (params.get('filter') as MedicineFilter) ?? 'all'
  const [filter, setFilter] = useState<MedicineFilter>(
    FILTER_VALUES.includes(initialFilter) ? initialFilter : 'all',
  )
  const [search, setSearch] = useState('')
  const [manufacturer, setManufacturer] = useState('all')
  const [view, setView] = useLocalStorage<MedicineView>('pms_med_view', 'table')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null)
  const [drawer, setDrawer] = useState<Medicine | null>(null)

  const createMut = useCreateMedicine()
  const updateMutation = useUpdateMedicine()
  const deleteMutation = useDeleteMedicine()

  // Reflect the active filter in the URL (shareable links).
  useEffect(() => {
    const next = new URLSearchParams(params)
    if (filter === 'all') params.forEach((_v, k) => k === 'filter' && next.delete('filter'))
    else params.set('filter', filter)
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const medicines = data ?? []

  const manufacturers = useMemo(() => {
    const set = new Set<string>()
    medicines.forEach((m) => m.manufacturer && set.add(m.manufacturer))
    return Array.from(set).sort()
  }, [medicines])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return medicines.filter((m) => {
      if (!matchesFilter(m, filter)) return false
      if (manufacturer !== 'all' && m.manufacturer !== manufacturer) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        m.medicine_code.toLowerCase().includes(q) ||
        (m.generic_name ?? '').toLowerCase().includes(q) ||
        (m.manufacturer ?? '').toLowerCase().includes(q)
      )
    })
  }, [medicines, filter, manufacturer, search])

  /* ------------------------------------------------------------ actions */

  function handleCreate(payload: MedicineCreate | MedicineUpdate) {
    createMut.mutate(payload as MedicineCreate, {
      onSuccess: (m) => {
        push({ type: 'success', title: 'Medicine added', message: `${m.name} is now in the inventory.` })
        setFormOpen(false)
      },
      onError: (e: unknown) => {
        push({ type: 'error', title: 'Could not add medicine', message: (e as Error).message })
      },
    })
  }

  function handleUpdate(payload: MedicineCreate | MedicineUpdate) {
    if (!editing) return
    updateMutation.mutate(
      { id: editing.id, payload: payload as MedicineUpdate },
      {
        onSuccess: (m) => {
          push({ type: 'success', title: 'Changes saved', message: `${m.name} updated.` })
          setFormOpen(false)
          setEditing(null)
        },
        onError: (e: unknown) => {
          push({ type: 'error', title: 'Could not save', message: (e as Error).message })
        },
      },
    )
  }

  function handleDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        push({ type: 'success', title: 'Medicine deleted', message: `${target.name} was removed.` })
        setDeleteTarget(null)
      },
      onError: (e: unknown) => {
        push({ type: 'error', title: 'Could not delete', message: (e as Error).message })
        setDeleteTarget(null)
      },
    })
  }

  function openEdit(m: Medicine) {
    setEditing(m)
    setFormOpen(true)
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  /* ------------------------------------------------------------- export */

  function exportCsv() {
    const header = [
      'Code',
      'Name',
      'Generic',
      'Manufacturer',
      'Dosage',
      'Strength',
      'Selling price',
      'Cost',
      'Stock',
      'Min stock',
      'Max stock',
      'Batch',
      'Manufactured',
      'Expiry',
      'Storage',
      'Active',
    ]
    const rows = filtered.map((m) => [
      m.medicine_code,
      m.name,
      m.generic_name ?? '',
      m.manufacturer ?? '',
      m.dosage_form ?? '',
      m.strength ?? '',
      m.unit_price,
      m.purchase_price,
      m.quantity_in_stock,
      m.minimum_stock_level,
      m.maximum_stock_level ?? '',
      m.batch_number ?? '',
      formatDate(m.manufacture_date),
      formatDate(m.expiry_date),
      m.storage_location ?? '',
      m.is_active ? 'yes' : 'no',
    ])
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medicines-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    push({ type: 'info', title: 'Export ready', message: `${filtered.length} rows downloaded as CSV.` })
  }

  function printTable() {
    window.print()
  }

  /* -------------------------------------------------------------- render */

  if (isError) {
    return (
      <div className="panel rounded-3xl">
        <EmptyState
          title="Couldn't load medicines"
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
    )
  }

  return (
    <div className="space-y-4">
      <SummaryCards medicines={medicines} active={filter} onSelect={setFilter} />

      <MedicineToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        manufacturer={manufacturer}
        onManufacturer={setManufacturer}
        manufacturers={manufacturers}
        view={view}
        onView={setView}
        isManager={isManager}
        count={filtered.length}
        onAdd={openAdd}
        onExportCsv={exportCsv}
        onPrint={printTable}
      />

      {isLoading ? (
        <div className="panel space-y-2 rounded-2xl p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel rounded-2xl">
          <EmptyState
            title={search || filter !== 'all' || manufacturer !== 'all' ? 'No matching medicines' : 'No medicines yet'}
            description={
              search || filter !== 'all' || manufacturer !== 'all'
                ? 'Try adjusting your search or filters.'
                : isManager
                  ? 'Add your first medicine to get started.'
                  : 'Nothing has been added to the inventory yet.'
            }
            action={
              isManager && !(search || filter !== 'all' || manufacturer !== 'all') ? (
                <button
                  type="button"
                  onClick={openAdd}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
                >
                  Add medicine
                </button>
              ) : undefined
            }
          />
        </div>
      ) : view === 'table' ? (
        <MedicineTable
          data={filtered}
          isManager={isManager}
          onView={(m) => setDrawer(m)}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      ) : (
        <MedicineGrid
          data={filtered}
          isManager={isManager}
          onView={(m) => setDrawer(m)}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <MedicineDrawer
        medicine={drawer}
        open={Boolean(drawer)}
        onOpenChange={(open) => !open && setDrawer(null)}
        isManager={isManager}
        onEdit={(m) => {
          setDrawer(null)
          openEdit(m)
        }}
        onDelete={(m) => {
          setDrawer(null)
          setDeleteTarget(m)
        }}
      />

      <MedicineFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        medicine={editing}
        submitting={createMut.isPending || updateMutation.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete medicine"
        message={`This permanently removes "${deleteTarget?.name ?? ''}" (${deleteTarget?.medicine_code ?? ''}) from the inventory. This cannot be undone.`}
        confirmLabel="Delete medicine"
        requireText={deleteTarget?.medicine_code}
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
