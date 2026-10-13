import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Floating, CSS-3D medicine bottle (no WebGL — stays cheap and crisp). */
function Bottle3D() {
  return (
    <div className="relative h-28 w-28 [perspective:700px]" aria-hidden>
      <div className="absolute inset-0 animate-float-slow [transform-style:preserve-3d] [transform:rotateX(14deg)_rotateY(-18deg)]">
        <svg viewBox="0 0 120 160" className="h-full w-full drop-shadow-[0_18px_24px_rgba(46,125,50,0.28)]">
          <defs>
            <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A5D6A7" />
              <stop offset="55%" stopColor="#66BB6A" />
              <stop offset="100%" stopColor="#2E7D32" />
            </linearGradient>
            <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5f6b7a" />
              <stop offset="100%" stopColor="#2b3440" />
            </linearGradient>
          </defs>
          <rect x="46" y="8" width="28" height="20" rx="5" fill="url(#cap)" />
          <path d="M40 30h40l8 16v96a12 12 0 0 1-12 12H44a12 12 0 0 1-12-12V46z" fill="url(#glassBody)" />
          <rect x="44" y="72" width="32" height="46" rx="4" fill="#ffffff" opacity="0.85" />
          <path d="M60 82v26M52 95h16" stroke="#2E7D32" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

export default function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 px-6 py-14 text-center', className)}>
      <Bottle3D />
      <div>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
