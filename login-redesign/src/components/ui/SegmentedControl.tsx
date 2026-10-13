import type { ComponentType, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ComponentType<{ className?: string }>
  badge?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
  ariaLabel?: string
}

/**
 * Keyboard-accessible segmented control (used for payment method + view mode).
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border border-line/30 bg-surface-2/70 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-xl font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/60',
              size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
              active ? 'text-white' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute inset-0 -z-0 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 shadow-glow"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {Icon && <Icon className="h-4 w-4" />}
              {opt.label}
              {opt.badge}
            </span>
          </button>
        )
      })}
    </div>
  )
}
