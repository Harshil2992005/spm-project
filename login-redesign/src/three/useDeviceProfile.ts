import { useEffect, useState } from 'react'

interface NavigatorWithExtras extends Navigator {
  deviceMemory?: number
  connection?: { saveData?: boolean; effectiveType?: string }
}

export interface DeviceProfile {
  /** Safe to mount the WebGL scene. */
  useWebGL: boolean
  /** User/OS prefers reduced motion. */
  reducedMotion: boolean
  /** Coarse pointer (touch) — disables tilt/parallax interactions. */
  isTouch: boolean
  /** Reason we fell back, for debugging/telemetry. */
  reason?: string
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Detects whether the device can comfortably run the WebGL hero.
 * Low-end / data-saver / reduced-motion devices get the static fallback.
 */
export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(() => ({
    useWebGL: false,
    reducedMotion: prefersReducedMotion(),
    isTouch: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  }))

  useEffect(() => {
    const nav = navigator as NavigatorWithExtras
    const reducedMotion = prefersReducedMotion()
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    const cores = nav.hardwareConcurrency ?? 8
    const mem = nav.deviceMemory ?? 8
    const saveData = nav.connection?.saveData === true
    const slowNet = /(^|-)2g$/.test(nav.connection?.effectiveType ?? '')

    // WebGL availability check.
    let hasWebGL = false
    try {
      const canvas = document.createElement('canvas')
      hasWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
      )
    } catch {
      hasWebGL = false
    }

    let reason: string | undefined
    if (reducedMotion) reason = 'reduced-motion'
    else if (!hasWebGL) reason = 'no-webgl'
    else if (saveData) reason = 'save-data'
    else if (slowNet) reason = 'slow-network'
    else if (cores <= 4) reason = 'low-cores'
    else if (mem <= 2) reason = 'low-memory'

    const useWebGL = reason === undefined

    setProfile({ useWebGL, reducedMotion, isTouch, reason })
  }, [])

  return profile
}

/** Live-updating reduced-motion flag (responds to OS changes). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
