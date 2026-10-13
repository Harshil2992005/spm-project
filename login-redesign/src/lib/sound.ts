/**
 * Tiny WebAudio helper for optional UI sounds (off by default).
 * No assets required — tones are synthesised on the fly.
 */
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return ctx
  } catch {
    return null
  }
}

function blip(freq: number, duration: number, type: OscillatorType = 'sine') {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + duration)
}

export function playSuccess() {
  blip(660, 0.12)
  window.setTimeout(() => blip(880, 0.16), 110)
}

export function playError() {
  blip(220, 0.18, 'triangle')
}
