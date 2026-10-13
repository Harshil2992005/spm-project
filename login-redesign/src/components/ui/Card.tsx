import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '../../lib/cn'
import { usePreferences } from '../../state/Preferences'

/** Crisp, non-distorting surface panel for data areas. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('panel rounded-2xl', className)}>{children}</div>
}

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max rotation in degrees (kept subtle: 4–6). */
  max?: number
  glare?: boolean
}

/**
 * Cursor-reactive 3D tilt card with a soft light spot. Automatically disabled
 * on touch devices and whenever effects are turned off. Content is lifted on
 * the Z axis so it reads as a real layer.
 */
export default function TiltCard({ children, className, max = 6, glare = true }: TiltCardProps) {
  const { effectsEnabled, isTouch } = usePreferences()
  const disabled = !effectsEnabled || isTouch
  const ref = useRef<HTMLDivElement>(null)

  const rx = useSpring(0, { stiffness: 260, damping: 24 })
  const ry = useSpring(0, { stiffness: 260, damping: 24 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const spot = useMotionTemplate`radial-gradient(240px circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.18), transparent 62%)`

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * max * 2)
    rx.set((0.5 - py) * max * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  function reset() {
    rx.set(0)
    ry.set(0)
    gx.set(50)
    gy.set(50)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={disabled ? undefined : { rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 1000 }}
      className={cn('glass gradient-border relative rounded-3xl', className)}
    >
      {glare && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ background: spot, opacity: disabled ? 0 : 1 }}
        />
      )}
      <div style={disabled ? undefined : { transform: 'translateZ(28px)' }}>{children}</div>
    </motion.div>
  )
}
