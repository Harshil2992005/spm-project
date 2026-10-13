import { motion } from 'framer-motion'

const ORBS = [
  { c: 'rgba(76,175,80,0.55)', s: 420, left: '6%', top: '10%', d: 18, drift: 26 },
  { c: 'rgba(20,184,166,0.50)', s: 360, left: '66%', top: '4%', d: 22, drift: 30 },
  { c: 'rgba(134,239,172,0.50)', s: 320, left: '58%', top: '62%', d: 20, drift: 22 },
  { c: 'rgba(45,212,191,0.42)', s: 300, left: '10%', top: '68%', d: 24, drift: 28 },
]

/**
 * Full-screen animated background: mesh gradient + drifting blurred orbs +
 * faint grid + film grain. Pure CSS/motion — safe on every device.
 */
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base colour */}
      <div className="absolute inset-0 bg-slate-100 transition-colors duration-500 dark:bg-[#050b14]" />

      {/* Animated mesh gradient */}
      <motion.div
        className="absolute -inset-[20%] opacity-90 dark:opacity-80"
        style={{
          background:
            'radial-gradient(40% 40% at 20% 25%, rgba(46,125,50,0.55) 0%, transparent 60%),' +
            'radial-gradient(35% 35% at 80% 20%, rgba(20,184,166,0.45) 0%, transparent 60%),' +
            'radial-gradient(45% 45% at 65% 80%, rgba(76,175,80,0.40) 0%, transparent 62%),' +
            'radial-gradient(35% 35% at 15% 85%, rgba(45,212,191,0.35) 0%, transparent 60%)',
        }}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Floating blurred orbs */}
      {ORBS.map((o) => (
        <motion.div
          key={o.left + o.top}
          className="absolute rounded-full"
          style={{
            width: o.s,
            height: o.s,
            left: o.left,
            top: o.top,
            background: `radial-gradient(circle at 30% 30%, ${o.c}, transparent 70%)`,
            filter: 'blur(50px)',
          }}
          animate={{ x: [0, o.drift, 0], y: [0, -o.drift / 1.4, 0] }}
          transition={{ duration: o.d, ease: 'easeInOut', repeat: Infinity }}
        />
      ))}

      {/* Faint grid, fading at the edges */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(100,116,139,1) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(100,116,139,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(70% 60% at 50% 40%, #000 10%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 40%, #000 10%, transparent 80%)',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
          opacity: 0.04,
        }}
      />
    </div>
  )
}
