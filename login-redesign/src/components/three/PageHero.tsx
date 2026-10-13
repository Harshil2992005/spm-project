import { Suspense, lazy, useRef } from 'react'
import { cn } from '../../lib/cn'
import { usePreferences } from '../../state/Preferences'
import { useInView, usePageVisible } from '../../hooks/useUtils'

// three.js is code-split: only downloaded when a device can actually render it.
const HeroStrip = lazy(() => import('../../three/HeroStrip'))

function CssOrbs() {
  return (
    <>
      <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-brand-400/25 blur-3xl" />
      <div className="absolute right-0 top-4 h-32 w-32 rounded-full bg-teal/25 blur-3xl" />
    </>
  )
}

/**
 * Decorative 3D strip behind a page title. Falls back to CSS orbs on low-end
 * devices / reduced-motion, pauses when off-screen or when the tab is hidden.
 */
export default function PageHero({ className }: { className?: string }) {
  const { useWebGL } = usePreferences()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)
  const visible = usePageVisible()

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden opacity-70', className)}
    >
      {useWebGL ? (
        <Suspense fallback={<CssOrbs />}>
          <HeroStrip paused={!inView || !visible} />
        </Suspense>
      ) : (
        <CssOrbs />
      )}
    </div>
  )
}
