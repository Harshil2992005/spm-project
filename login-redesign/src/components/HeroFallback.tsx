import { motion } from 'framer-motion'

/**
 * Static / CSS-3D fallback for low-end devices, reduced-motion users, or when
 * WebGL is unavailable. No canvas, no WebGL — just gradients and CSS motion.
 */
export default function HeroFallback() {
  const shapes = [
    { emoji: '💊', top: '18%', left: '22%', size: 64, delay: 0 },
    { emoji: '💊', top: '30%', left: '68%', size: 48, delay: 0.6 },
    { emoji: '🩹', top: '62%', left: '30%', size: 44, delay: 1.1 },
    { emoji: '🧴', top: '58%', left: '72%', size: 52, delay: 0.3 },
    { emoji: '⚕️', top: '44%', left: '14%', size: 40, delay: 0.9 },
  ]
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(50% 50% at 30% 25%, rgba(46,125,50,0.75), transparent 65%),' +
            'radial-gradient(45% 45% at 75% 70%, rgba(20,184,166,0.6), transparent 65%),' +
            'linear-gradient(160deg, #052e16 0%, #064e3b 50%, #0f766e 100%)',
        }}
      />

      {/* Floating “hero” cross */}
      <motion.div
        aria-hidden
        className="relative z-10 grid h-40 w-40 place-items-center"
        animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute h-16 w-40 rounded-2xl bg-gradient-to-br from-[#86efac] to-[#2E7D32] shadow-[0_20px_50px_-12px_rgba(46,125,50,0.9)]" />
        <div className="absolute h-40 w-16 rounded-2xl bg-gradient-to-br from-[#86efac] to-[#2E7D32] shadow-[0_20px_50px_-12px_rgba(46,125,50,0.9)]" />
      </motion.div>

      {shapes.map((s, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute select-none drop-shadow-lg"
          style={{ top: s.top, left: s.left, fontSize: s.size }}
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        >
          {s.emoji}
        </motion.span>
      ))}
    </div>
  )
}
