import { cn } from '../../lib/cn'

interface StockBarProps {
  value: number
  max?: number
  level: 'out' | 'low' | 'healthy'
  className?: string
}

const FILL: Record<StockBarProps['level'], string> = {
  out: 'bg-danger',
  low: 'bg-warning',
  healthy: 'bg-success',
}

/** Mini stock meter — a coloured bar with a numeric readout alongside. */
export default function StockBar({ value, max = 100, level, className }: StockBarProps) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-3" aria-hidden>
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', FILL[level])}
          style={{ width: `${level === 'out' ? 100 : pct}%`, opacity: level === 'out' ? 0.5 : 1 }}
        />
      </div>
      <span className="tabular w-8 text-right text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
