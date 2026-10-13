import { Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { usePreferences } from '../../state/Preferences'

const SuccessBurst = lazy(() => import('../../three/SuccessBurst'))

/**
 * Full-screen "bill paid" moment: a 3D capsule burst (WebGL devices) plus an
 * animated check. Reduced-motion users get just a quick fade of the check.
 */
export default function CelebrationOverlay({ show, onDone }: { show: boolean; onDone?: () => void }) {
  const { useWebGL, effectsEnabled } = usePreferences()

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/35 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
          role="status"
          aria-live="polite"
        >
          {useWebGL && effectsEnabled && (
            <div className="absolute inset-0" aria-hidden>
              <Suspense fallback={null}>
                <SuccessBurst onDone={onDone} />
              </Suspense>
            </div>
          )}

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.08 }}
            className="glass relative z-10 flex flex-col items-center gap-3 rounded-3xl px-8 py-7 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 16, delay: 0.16 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow"
            >
              <Check className="h-8 w-8" strokeWidth={3} />
            </motion.span>
            <p className="font-display text-xl font-bold text-ink">Bill generated</p>
            <p className="text-sm text-muted">Stock updated · invoice ready</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
