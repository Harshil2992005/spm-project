import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

interface PrimaryButtonProps {
  children: ReactNode
  type?: 'submit' | 'button'
  loading?: boolean
  success?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

/**
 * Primary action button with 3D depth, hover shine, magnetic cursor pull,
 * press-down feedback and a loading → success state morph.
 * Width is kept stable across states so the layout never jumps.
 */
export default function PrimaryButton({
  children,
  type = 'submit',
  loading = false,
  success = false,
  disabled = false,
  onClick,
  className = '',
}: PrimaryButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mx = useSpring(0, { stiffness: 300, damping: 20 })
  const my = useSpring(0, { stiffness: 300, damping: 20 })

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || disabled) return
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    // Pull is limited to a few px so it feels magnetic, not floaty.
    mx.set(Math.max(-6, Math.min(6, dx * 0.12)))
    my.set(Math.max(-5, Math.min(5, dy * 0.12)))
  }

  function reset() {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      ref={wrapRef}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={className}
    >
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        style={{ x: mx, y: my }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className="btn-primary relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {/* Shine sweep */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        />

        <span className={`flex items-center gap-2 transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
          {success ? (
            <>
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              >
                <Check className="h-5 w-5" />
              </motion.span>
              <span>Signed in</span>
            </>
          ) : (
            children
          )}
        </span>

        {loading && !success && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="sr-only">Signing in…</span>
          </span>
        )}
      </motion.button>
    </div>
  )
}
