import { createContext, useContext, type ReactNode } from 'react'
import { useDeviceProfile } from '../three/useDeviceProfile'
import { useLocalStorage } from '../hooks/useUtils'

interface PreferencesContextValue {
  /** User toggle: turn every non-essential effect off. */
  reduceEffects: boolean
  setReduceEffects: (v: boolean) => void
  /** User toggle for success/error sounds (off by default). */
  sound: boolean
  setSound: (v: boolean) => void
  /** Effects may run given device capability + user preference. */
  effectsEnabled: boolean
  /** Safe to mount WebGL given device + preference. */
  useWebGL: boolean
  isTouch: boolean
  reducedMotion: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { useWebGL, reducedMotion, isTouch } = useDeviceProfile()
  const [reduceEffects, setReduceEffects] = useLocalStorage('pms_reduce_effects', false)
  const [sound, setSound] = useLocalStorage('pms_sound', false)

  const effectsEnabled = !reduceEffects && !reducedMotion

  const value: PreferencesContextValue = {
    reduceEffects,
    setReduceEffects,
    sound,
    setSound,
    effectsEnabled,
    useWebGL: useWebGL && effectsEnabled,
    isTouch,
    reducedMotion,
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within <PreferencesProvider>')
  return ctx
}
