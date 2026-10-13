import { useEffect, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FileText, Pill, Search, User } from 'lucide-react'
import { useBills, useMedicines, usePatients } from '../hooks/useData'
import { cn } from '../lib/cn'
import { navItemsFor } from './nav'
import { useAuth } from '../state/AuthProvider'

interface Cmd {
  id: string
  label: string
  hint: string
  icon: React.ReactNode
  run: () => void
}

/** Ctrl/Cmd+K palette: jump to pages or search medicines, patients and bills. */
export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: medicines = [] } = useMedicines()
  const { data: patients = [] } = usePatients(open && isManager)
  const { data: bills = [] } = useBills()

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const commands = useMemo<Cmd[]>(() => {
    const go = (path: string) => {
      onOpenChange(false)
      navigate(path)
    }
    const pages: Cmd[] = navItemsFor(isManager).map((n) => ({
      id: `page-${n.to}`,
      label: `Go to ${n.label}`,
      hint: 'Page',
      icon: <n.icon className="h-4 w-4" />,
      run: () => go(n.to),
    }))
    const meds: Cmd[] = medicines.map((m) => ({
      id: `med-${m.id}`,
      label: m.name,
      hint: `Medicine · ${m.medicine_code}`,
      icon: <Pill className="h-4 w-4" />,
      run: () => go('/medicines'),
    }))
    const pats: Cmd[] = patients.map((p) => ({
      id: `pat-${p.id}`,
      label: `${p.first_name} ${p.last_name}`,
      hint: `Patient · ${p.patient_id}`,
      icon: <User className="h-4 w-4" />,
      run: () => go('/patients'),
    }))
    const billsCmds: Cmd[] = bills.map((b) => ({
      id: `bill-${b.id}`,
      label: b.bill_number,
      hint: `Bill · ₹${Number(b.net_amount).toFixed(0)}`,
      icon: <FileText className="h-4 w-4" />,
      run: () => go('/billing'),
    }))
    return [...pages, ...meds, ...pats, ...billsCmds]
  }, [medicines, patients, bills, navigate, onOpenChange, isManager])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands.slice(0, 8)
    return commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q)).slice(0, 12)
  }, [commands, query])

  useEffect(() => setActive(0), [query])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[active]?.run()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-slate-900/45 backdrop-blur-[3px]" />
        <Dialog.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl animate-scale-in rounded-3xl border border-line/30 bg-surface/95 shadow-card backdrop-blur-2xl focus:outline-none dark:bg-surface-2/95 dark:shadow-card-dark">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search pages, medicines, patients and bills.
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-line/20 px-4 py-3">
            <Search className="h-5 w-5 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search pages, medicines, patients, bills…"
              aria-label="Search"
              className="h-8 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
            <kbd className="rounded-md border border-line/40 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted">
              Esc
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[50vh] overflow-y-auto scrollbar-thin p-2" role="listbox">
            {filtered.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted">No matches for “{query}”.</p>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => c.run()}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors',
                    i === active ? 'bg-brand-500/12 text-ink' : 'text-ink-soft hover:bg-brand-500/8',
                  )}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand-600">
                    {c.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{c.label}</span>
                    <span className="block truncate text-[11px] text-muted">{c.hint}</span>
                  </span>
                  {active === filtered.indexOf(c) && <CornerDownLeft className="h-4 w-4 text-muted" />}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line/20 px-4 py-2 text-[11px] text-muted">
            <span>↑ ↓ navigate · Enter to open · Esc to close</span>
            <span>{filtered.length} results</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
