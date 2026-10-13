import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import Chip from '../../components/ui/Chip'
import Dropdown, { DropdownItem, DropdownSeparator } from '../../components/ui/Dropdown'
import StockBar from '../../components/ui/StockBar'
import { daysUntil, expiryLevel, formatCurrency, formatDate, stockLevel } from '../../lib/format'
import type { Medicine } from '../../lib/types'

interface MedicineTableProps {
  data: Medicine[]
  isManager: boolean
  onView: (m: Medicine) => void
  onEdit: (m: Medicine) => void
  onDelete: (m: Medicine) => void
}

const col = createColumnHelper<Medicine>()

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

function StockChip({ m }: { m: Medicine }) {
  const level = stockLevel(m)
  if (level === 'out') return <Chip tone="danger">Out</Chip>
  if (level === 'low') return <Chip tone="warn">Low</Chip>
  return <Chip tone="ok">In stock</Chip>
}

function ExpiryCell({ m }: { m: Medicine }) {
  const level = expiryLevel(m)
  const days = daysUntil(m.expiry_date)
  const tone = level === 'expired' ? 'danger' : level === 'expiring' ? 'warn' : 'neutral'
  const label =
    level === 'expired'
      ? `Expired ${Math.abs(days ?? 0)}d ago`
      : days !== null && days <= 30
        ? `${days}d left`
        : formatDate(m.expiry_date)
  return (
    <div className="flex flex-col gap-0.5">
      <Chip tone={tone}>{label}</Chip>
      <span className="text-[11px] text-muted">{formatDate(m.expiry_date)}</span>
    </div>
  )
}

export default function MedicineTable({ data, isManager, onView, onEdit, onDelete }: MedicineTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])

  const columns = useMemo(
    () => [
      col.accessor('medicine_code', {
        header: (ctx) => (
          <SortHeader label="Code" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => <span className="tabular text-xs font-semibold text-muted">{info.getValue()}</span>,
      }),
      col.accessor('name', {
        header: (ctx) => (
          <SortHeader label="Medicine" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => {
          const m = info.row.original
          return (
            <div className="min-w-[180px]">
              <p className="font-semibold text-ink">{m.name}</p>
              <p className="text-xs text-muted">
                {[m.generic_name, m.strength].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
          )
        },
      }),
      col.accessor('manufacturer', {
        header: 'Manufacturer',
        cell: (info) => {
          const m = info.row.original
          return (
            <div className="min-w-[140px]">
              <p className="text-sm text-ink-soft">{m.manufacturer || '—'}</p>
              <p className="text-[11px] text-muted">{m.dosage_form || ''}</p>
            </div>
          )
        },
      }),
      col.accessor('unit_price', {
        header: (ctx) => (
          <SortHeader label="Price" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => (
          <div className="text-right">
            <p className="tabular text-sm font-semibold text-ink">{formatCurrency(info.getValue())}</p>
            <p className="tabular text-[11px] text-muted">cost {formatCurrency(info.row.original.purchase_price)}</p>
          </div>
        ),
      }),
      col.accessor('quantity_in_stock', {
        header: (ctx) => (
          <div className="text-right">
            <SortHeader
              label="Stock"
              dir={ctx.column.getIsSorted()}
              onClick={ctx.column.getToggleSortingHandler()!}
            />
          </div>
        ),
        cell: (info) => {
          const m = info.row.original
          return (
            <div className="flex flex-col items-end gap-1">
              <StockBar value={m.quantity_in_stock} max={m.maximum_stock_level ?? 100} level={stockLevel(m)} />
              <span className="text-[11px] text-muted">min {m.minimum_stock_level}</span>
            </div>
          )
        },
      }),
      col.accessor('expiry_date', {
        header: (ctx) => (
          <SortHeader label="Expiry" dir={ctx.column.getIsSorted()} onClick={ctx.column.getToggleSortingHandler()!} />
        ),
        cell: (info) => <ExpiryCell m={info.row.original} />,
      }),
      col.display({
        id: 'status',
        header: 'Status',
        cell: (info) => <StockChip m={info.row.original} />,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: (info) => {
          const m = info.row.original
          return (
            <div className="text-right">
              <Dropdown
                trigger={
                  <button
                    type="button"
                    aria-label={`Actions for ${m.name}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                }
              >
                <DropdownItem icon={<Eye className="h-4 w-4" />} onSelect={() => onView(m)}>
                  View details
                </DropdownItem>
                {isManager && (
                  <>
                    <DropdownItem icon={<Pencil className="h-4 w-4" />} onSelect={() => onEdit(m)}>
                      Edit
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onSelect={() => onDelete(m)}>
                      Delete
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </div>
          )
        },
      }),
    ],
    [isManager, onView, onEdit, onDelete],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const rows = table.getRowModel().rows

  return (
    <div className="panel overflow-hidden rounded-2xl">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-line/25 bg-surface-2/60">
              {table.getHeaderGroups().map((hg) =>
                hg.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-4 py-3 text-left text-xs uppercase tracking-wide">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onView(row.original)}
                className="group cursor-pointer border-b border-line/12 transition-colors last:border-0 hover:bg-brand-500/[0.04]"
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

      {/* Pagination */}
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
            {data.length} item{data.length === 1 ? '' : 's'}
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
