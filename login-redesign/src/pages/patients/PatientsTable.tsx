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
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import Chip from '../../components/ui/Chip'
import Dropdown, { DropdownItem, DropdownSeparator } from '../../components/ui/Dropdown'
import { formatDate, initials, patientName } from '../../lib/format'
import type { Patient } from '../../lib/types'

interface PatientsTableProps {
  data: Patient[]
  isManager: boolean
  onEdit: (p: Patient) => void
  onDelete: (p: Patient) => void
}

const col = createColumnHelper<Patient>()

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

function ageFrom(dob?: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  const age = Math.floor(diff / (365.25 * 86_400_000))
  return age >= 0 && age < 150 ? age : null
}

export default function PatientsTable({ data, isManager, onEdit, onDelete }: PatientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'patient_id', desc: false }])

  const columns = [
    col.accessor('patient_id', {
      header: (ctx) => (
        <SortHeader label="Patient ID" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
      ),
      cell: (info) => <span className="tabular text-xs font-semibold text-muted">{info.getValue()}</span>,
    }),
    col.accessor((p) => `${p.first_name} ${p.last_name}`, {
      id: 'name',
      header: (ctx) => (
        <SortHeader label="Patient" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
      ),
      cell: (info) => {
        const p = info.row.original
        const age = ageFrom(p.date_of_birth)
        return (
          <div className="flex min-w-[200px] items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-brand-500 to-brand-600 text-xs font-bold text-white shadow-key">
              {initials(p.first_name, p.last_name)}
            </span>
            <div>
              <p className="font-semibold text-ink">{patientName(p)}</p>
              <p className="text-xs text-muted">
                {[p.gender, age !== null ? `${age} yrs` : null].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          </div>
        )
      },
    }),
    col.accessor('date_of_birth', {
      header: (ctx) => (
        <SortHeader label="Date of birth" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
      ),
      cell: (info) => <span className="tabular text-sm text-ink-soft">{formatDate(info.getValue())}</span>,
    }),
    col.accessor('phone', {
      header: 'Contact',
      cell: (info) => {
        const p = info.row.original
        return (
          <div className="flex min-w-[140px] gap-1.5 text-[11px] font-semibold">
            <span className={`rounded-full px-2 py-0.5 ${p.phone ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-500/10 text-muted'}`}>Phone</span>
            <span className={`rounded-full px-2 py-0.5 ${p.email ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-500/10 text-muted'}`}>E-mail</span>
          </div>
        )
      },
    }),
    col.display({
      id: 'insurance',
      header: 'Insurance',
      cell: (info) => {
        const p = info.row.original
        if (!p.insurance_number && !p.insurance_provider) {
          return <span className="text-xs text-muted">Not on file</span>
        }
        return (
          <div className="flex flex-col items-start gap-1">
            {p.insurance_provider && <Chip tone="neutral">{p.insurance_provider}</Chip>}
            {p.insurance_number && <span className="tabular text-[11px] text-muted">{p.insurance_number}</span>}
          </div>
        )
      },
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const p = info.row.original
        if (!isManager) return null
        return (
          <div className="text-right">
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label={`Actions for ${patientName(p)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
            >
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onSelect={() => onEdit(p)}>
                Edit
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onSelect={() => onDelete(p)}>
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        )
      },
    }),
  ]

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
              <tr
                key={row.id}
                onClick={() => isManager && onEdit(row.original)}
                className={isManager ? 'cursor-pointer border-b border-line/12 transition-colors last:border-0 hover:bg-brand-500/[0.04]' : 'border-b border-line/12 last:border-0'}
              >
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
            {data.length} patient{data.length === 1 ? '' : 's'}
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
