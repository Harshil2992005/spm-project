import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  /** Disable pointer-tilt while typing or on touch devices. */
  disabledTilt?: boolean
  className?: string
}

const MAX_TILT = 8 // degrees

/**
 * Frosted glass panel with a subtle cursor-reactive 3D tilt and moving glare.
 * Tilt is automatically disabled for touch pointers and reduced-motion users.
 */
export default function GlassCard({ children, disabledTilt = false, className = '' }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const rx = useSpring(0, { stiffness: 220, damping: 22 })
  const ry = useSpring(0, { stiffness: 220, damping: 22 })
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)

  const glare = useMotionTemplate`radial-gradient(220px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 60%)`

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (disabledTilt || e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * (MAX_TILT * 2))
    rx.set((0.5 - py) * (MAX_TILT * 2))
    glareX.set(px * 100)
    glareY.set(py * 100)
  }

  function reset() {
    rx.set(0)
    ry.set(0)
    glareX.set(50)
    glareY.set(50)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={`glass gradient-border relative rounded-3xl ${className}`}
    >
      {/* Cursor-reactive glare */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ background: glare, opacity: disabledTilt ? 0 : 1 }}
      />
      <div style={{ transform: 'translateZ(40px)' }}>{children}</div>
    </motion.div>
  )
}
