import { cn } from '../lib/cn'

interface BrandMarkProps {
  size?: number
  animated?: boolean
  className?: string
}

/** Layered 3D medical-cross mark built purely with CSS transforms. */
export default function BrandMark({ size = 38, animated = true, className }: BrandMarkProps) {
  const bar = Math.round(size * 0.34)
  return (
    <span
      className={cn('relative inline-block [perspective:420px]', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className={cn('absolute inset-0 block [transform-style:preserve-3d]', animated && 'mark-spin')}
      >
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-[6px] bg-gradient-to-b from-brand-400 to-brand-700 shadow-[0_6px_14px_-4px_rgba(46,125,50,0.75)]"
          style={{ width: bar, height: size }}
        />
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-[6px] bg-gradient-to-r from-brand-400 to-brand-600 shadow-[0_6px_14px_-4px_rgba(46,125,50,0.75)]"
          style={{ width: size, height: bar }}
        />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-[1px]"
          style={{ width: bar * 0.5, height: bar * 0.5 }}
        />
      </span>
    </span>
  )
}
