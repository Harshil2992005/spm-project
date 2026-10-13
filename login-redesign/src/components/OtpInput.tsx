import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'

interface OtpInputProps {
  /** Current code, e.g. "12" while typing. */
  value: string
  onChange: (value: string) => void
  /** Called once all boxes are filled. */
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  /** Triggers the shake + red styling. */
  error?: boolean
  autoFocus?: boolean
  /** id of the message describing the field (a11y). */
  'aria-describedby'?: string
}

/**
 * Accessible 6-box OTP field.
 * - auto-advances and auto-submits when full
 * - Backspace moves back, Arrow keys navigate
 * - pasting a full code distributes across boxes
 * - inputMode="numeric" + autocomplete="one-time-code" for SMS/WebOTP autofill
 */
export default function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = false,
  ...aria
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = useMemo(() => {
    const arr = value.replace(/\D/g, '').slice(0, length).split('')
    return Array.from({ length }, (_, i) => arr[i] ?? '')
  }, [value, length])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  function commit(next: string) {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  function handleChange(index: number, raw: string) {
    const onlyDigits = raw.replace(/\D/g, '')
    if (!onlyDigits) return
    // If the user typed quickly / autofilled several chars at once.
    if (onlyDigits.length > 1) {
      commit(onlyDigits)
      return
    }
    const next = digits.slice()
    next[index] = onlyDigits
    commit(next.join(''))
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.slice()
      if (next[index]) {
        next[index] = ''
        commit(next.join(''))
      } else if (index > 0) {
        next[index - 1] = ''
        commit(next.join(''))
        refs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    commit(e.clipboardData.getData('text'))
  }

  return (
    <motion.div
      role="group"
      aria-label="One-time passcode"
      className="flex items-center justify-between gap-2"
      animate={error ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={error}
          {...aria}
          className={`h-14 w-full min-w-0 rounded-2xl border bg-white/70 text-center text-xl font-bold text-ink outline-none transition
            focus:border-[#4CAF50] focus:ring-4 focus:ring-[#4CAF50]/25 disabled:opacity-50
            dark:bg-white/5
            ${error ? 'border-red-400 text-red-500' : 'border-line/50'}`}
        />
      ))}
    </motion.div>
  )
}
