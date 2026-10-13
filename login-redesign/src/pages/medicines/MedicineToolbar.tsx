import { Download, LayoutGrid, Plus, Printer, Table2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Dropdown, { DropdownItem } from '../../components/ui/Dropdown'
import SegmentedControl from '../../components/ui/SegmentedControl'
import { cn } from '../../lib/cn'
import type { MedicineFilter } from './SummaryCards'

const FILTERS: { value: MedicineFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low' },
  { value: 'out', label: 'Out' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
]

export type MedicineView = 'table' | 'grid'

interface ToolbarProps {
  search: string
  onSearch: (v: string) => void
  filter: MedicineFilter
  onFilter: (f: MedicineFilter) => void
  manufacturer: string
  onManufacturer: (m: string) => void
  manufacturers: string[]
  view: MedicineView
  onView: (v: MedicineView) => void
  isManager: boolean
  count: number
  onAdd: () => void
  onExportCsv: () => void
  onPrint: () => void
}

export default function MedicineToolbar({
  search,
  onSearch,
  filter,
  onFilter,
  manufacturer,
  onManufacturer,
  manufacturers,
  view,
  onView,
  isManager,
  count,
  onAdd,
  onExportCsv,
  onPrint,
}: ToolbarProps) {
  return (
    <div className="panel space-y-3 rounded-2xl p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name, code, manufacturer…"
            aria-label="Search medicines"
            className="h-11 w-full rounded-xl border border-line/40 bg-surface/70 pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:bg-white/5"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {manufacturers.length > 1 && (
          <select
            value={manufacturer}
            onChange={(e) => onManufacturer(e.target.value)}
            aria-label="Filter by manufacturer"
            className="h-11 rounded-xl border border-line/40 bg-surface/70 px-3 text-sm text-ink outline-none focus:border-brand-500 dark:bg-white/5"
          >
            <option value="all">All manufacturers</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}

        <SegmentedControl<MedicineView>
          ariaLabel="View mode"
          size="sm"
          className="hidden sm:inline-flex"
          value={view}
          onChange={onView}
          options={[
            { value: 'table', label: 'Table', icon: Table2 },
            { value: 'grid', label: 'Grid', icon: LayoutGrid },
          ]}
        />

        <Dropdown
          trigger={
            <Button variant="secondary" size="md" leftIcon={<Download className="h-4 w-4" />}>
              <span className="hidden sm:inline">Export</span>
            </Button>
          }
        >
          <DropdownItem icon={<Download className="h-4 w-4" />} onSelect={onExportCsv}>
            Download CSV
          </DropdownItem>
          <DropdownItem icon={<Printer className="h-4 w-4" />} onSelect={onPrint}>
            Print / PDF
          </DropdownItem>
        </Dropdown>

        {isManager && (
          <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={onAdd}>
            <span className="hidden sm:inline">Add</span>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilter(f.value)}
              aria-pressed={active}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                active ? 'bg-brand-600 text-white shadow-glow' : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-ink',
              )}
            >
              {f.label}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-muted tabular">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  )
}
