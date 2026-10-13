import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import { formatDate, patientName } from '../../lib/format'
import type { Patient, Prescription } from '../../lib/types'

interface PrescriptionsTableProps {
  data: Prescription[]
  patients: Patient[]
  isManager: boolean
  onEdit: (rx: Prescription) => void
  onDelete: (rx: Prescription) => void
}

const col = createColumnHelper<Prescription>()

function SortHeader({ label, onClick, dir }: { label: string; onClick: (e: unknown) => void; dir: false | 'asc' | 'desc' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-semibold text-muted transition hover:text-ink"
    >
      {label}
      {dir === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : dir === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  )
}

function statusTone(status: string): 'ok' | 'warn' | 'danger' | 'neutral' {
  if (status === 'Filled') return 'ok'
  if (status === 'Cancelled') return 'danger'
  if (status === 'Partially Filled') return 'warn'
  return 'neutral'
}

export default function PrescriptionsTable({ data, patients, isManager, onEdit, onDelete }: PrescriptionsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'prescription_number', desc: true }])

  const nameOf = useMemo(() => {
    const map = new Map(patients.map((p) => [p.id, p]))
    return (id: string) => {
      const p = map.get(id)
      return p ? `${p.patient_id} · ${p.first_name} ${p.last_name}` : id.slice(0, 8)
    }
  }, [patients])

  const columns = useMemo(
    () => [
      col.accessor('prescription_number', {
        header: (ctx) => (
          <SortHeader label="Rx #" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => <span className="tabular text-xs font-semibold text-ink">{info.getValue() || '—'}</span>,
      }),
      col.accessor('patient_id', {
        header: 'Patient',
        cell: (info) => (
          <div className="min-w-[170px]">
            <p className="text-sm font-semibold text-ink">{nameOf(info.getValue())}</p>
          </div>
        ),
      }),
      col.accessor('doctor_name', {
        header: (ctx) => (
          <SortHeader label="Doctor" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => {
          const p = info.row.original
          return (
            <div className="min-w-[150px]">
              <p className="text-sm text-ink-soft">{p.doctor_name}</p>
              <p className="text-[11px] text-muted">{p.doctor_license || ''}</p>
            </div>
          )
        },
      }),
      col.accessor('diagnosis', {
        header: 'Diagnosis',
        cell: (info) => <span className="line-clamp-2 max-w-[220px] text-sm text-ink-soft">{info.getValue() || '—'}</span>,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => <Chip tone={statusTone(info.getValue())}>{info.getValue()}</Chip>,
      }),
      col.accessor('issue_date', {
        header: (ctx) => (
          <SortHeader label="Issued" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => <span className="tabular text-sm text-ink-soft">{formatDate(info.getValue())}</span>,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          if (!isManager) return null
          const p = info.row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label={`Edit ${p.prescription_number ?? 'prescription'}`}
                onClick={() => onEdit(p)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-brand-500/10 hover:text-brand-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${p.prescription_number ?? 'prescription'}`}
                onClick={() => onDelete(p)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        },
      }),
    ],
    [isManager, nameOf, onEdit, onDelete],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="panel rounded-2xl">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line/25 bg-surface-2/40">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs uppercase tracking-wide">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line/12 transition-colors last:border-0 hover:bg-brand-500/[0.04]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/25 bg-surface-2/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>Rows per page</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="rounded-lg border border-line/40 bg-surface px-2 py-1 text-xs text-ink outline-none"
            aria-label="Rows per page"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="ml-1 hidden sm:inline">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular text-xs text-muted">
            {data.length} prescription{data.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-ink disabled:opacity-40 dark:hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-ink disabled:opacity-40 dark:hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
