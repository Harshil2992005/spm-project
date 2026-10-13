import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, Mail, RotateCw, Send, ShieldCheck, X } from 'lucide-react'
import Field from './Field'
import OtpInput from './OtpInput'
import PrimaryButton from './PrimaryButton'

interface OtpFormProps {
  /** Request a code for the given identifier (username / e-mail / phone). */
  onSend: (identifier: string) => Promise<boolean>
  /** Verify the 6-digit code. */
  onVerify: (identifier: string, code: string) => void
  sending?: boolean
  verifying?: boolean
  serverError?: { title: string; message: string } | null
  onDismissError?: () => void
  /** OTP returned by the server in demo mode (no SMTP) so it can be shown. */
  debugOtp?: string | null
  /** Where to start (useful when returning to the tab). */
  initialIdentifier?: string
}

const RESEND_SECONDS = 30

export default function OtpForm({
  onSend,
  onVerify,
  sending = false,
  verifying = false,
  serverError,
  onDismissError,
  debugOtp,
  initialIdentifier = '',
}: OtpFormProps) {
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [step, setStep] = useState<'input' | 'code'>('input')
  const [code, setCode] = useState('')
  const [shake, setShake] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
  const [cycle, setCycle] = useState(0)
  const timerRef = useRef<number | null>(null)

  // Countdown for resend.
  useEffect(() => {
    if (step !== 'code') return
    setSecondsLeft(RESEND_SECONDS)
    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [step, cycle])

  // When verification fails, shake + clear the boxes and refocus.
  useEffect(() => {
    if (serverError && step === 'code') {
      setShake(true)
      setCode('')
      const t = window.setTimeout(() => setShake(false), 500)
      return () => window.clearTimeout(t)
    }
  }, [serverError, step])

  async function handleSend() {
    if (!identifier.trim()) return
    const ok = await onSend(identifier.trim())
    if (ok) {
      setCode('')
      setStep('code')
    }
  }

  function handleComplete(full: string) {
    onVerify(identifier.trim(), full)
  }

  return (
    <div className="space-y-3.5">
      <AnimatePresence initial={false}>
        {serverError && (
          <motion.div
            key={serverError.message}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -6, 6, 0] }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2.5 overflow-hidden rounded-2xl border border-red-300/50 bg-red-50/80 px-3.5 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{serverError.title}</p>
              <p className="mt-0.5 text-xs opacity-90">{serverError.message}</p>
            </div>
            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                className="rounded-md p-0.5 transition hover:bg-red-100 dark:hover:bg-red-900/40"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'input' ? (
          <motion.div
            key="otp-input-step"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="space-y-3.5"
          >
            <Field
              id="otp-identifier"
              label="E-mail or username"
              icon={Mail}
              autoComplete="username"
              inputMode="email"
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <PrimaryButton type="button" onClick={handleSend} loading={sending}>
              <Send className="h-4 w-4" />
              Send OTP
            </PrimaryButton>
          </motion.div>
        ) : (
          <motion.div
            key="otp-code-step"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-[#2E7D32]/8 px-3.5 py-2.5 text-xs text-[#1B5E20] dark:bg-[#4CAF50]/10 dark:text-[#A5D6A7]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                We sent a 6-digit code to <b>{identifier}</b>
              </span>
            </div>

            {debugOtp && (
              <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                <span className="font-semibold">Demo mode</span> (SMTP not configured). Your code is{' '}
                <span className="font-mono text-sm font-bold tracking-[0.2em]">{debugOtp}</span>
              </div>
            )}

            <OtpInput
              value={code}
              onChange={setCode}
              onComplete={handleComplete}
              error={shake}
              disabled={verifying}
              autoFocus
              aria-describedby="otp-help"
            />

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('input')
                  setCode('')
                }}
                className="flex items-center gap-1.5 font-medium text-muted transition hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                Change e-mail
              </button>

              {secondsLeft > 0 ? (
                <span className="tabular-nums text-muted">Resend in {secondsLeft}s</span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (await onSend(identifier.trim())) setCycle((c) => c + 1)
                  }}
                  className="flex items-center gap-1.5 font-semibold text-[#2E7D32] transition hover:underline dark:text-[#81C784]"
                >
                  <RotateCw className="h-4 w-4" />
                  Resend code
                </button>
              )}
            </div>

            <PrimaryButton
              type="button"
              loading={verifying}
              disabled={code.length !== 6}
              onClick={() => onVerify(identifier.trim(), code)}
            >
              Verify &amp; Sign In
            </PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
