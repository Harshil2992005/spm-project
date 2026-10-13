import { motion } from 'framer-motion'
import type { ComponentType } from 'react'

export interface TabDef {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

interface TabSwitcherProps {
  tabs: TabDef[]
  value: string
  onChange: (id: string) => void
  /** Shared layout id so multiple switchers don't animate into each other. */
  layoutId?: string
}

/**
 * Pill-segmented control with a sliding animated indicator.
 * Implements the ARIA tabs pattern with arrow-key navigation.
 */
export default function TabSwitcher({ tabs, value, onChange, layoutId = 'tab-indicator' }: TabSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Sign-in method"
      className="relative grid grid-cols-2 gap-1 rounded-2xl bg-black/5 p-1 dark:bg-white/5"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const idx = tabs.findIndex((t) => t.id === value)
          const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length
          onChange(tabs[next].id)
          const nodes = (e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]')
          nodes[next]?.focus()
        }
      }}
    >
      {tabs.map((t) => {
        const active = t.id === value
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              active ? 'text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-[#4CAF50] to-[#2E7D32] shadow-[0_6px_16px_-6px_rgba(46,125,50,0.8)]"
              />
            )}
            {Icon && <Icon className="h-4 w-4" />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
