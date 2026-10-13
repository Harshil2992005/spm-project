import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  durationMs?: number
  className?: string
  /** Announce changes to screen readers (used for the bill total). */
  live?: boolean
}

/**
 * Count-up number that eases to the new value. Skips animation entirely when
 * the user prefers reduced motion.
 */
export default function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString('en-IN'),
  durationMs = 800,
  className,
  live,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (value - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs])

  return (
    <span className={cn('tabular', className)} aria-live={live ? 'polite' : undefined}>
      {format(display)}
    </span>
  )
}
