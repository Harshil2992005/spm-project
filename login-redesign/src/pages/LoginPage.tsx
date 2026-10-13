import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, ShieldCheck, Sun, Moon } from 'lucide-react'
import Background from '../components/Background'
import GlassCard from '../components/GlassCard'
import TabSwitcher, { type TabDef } from '../components/TabSwitcher'
import PasswordForm, { type PasswordSubmit } from '../components/PasswordForm'
import OtpForm from '../components/OtpForm'
import GoogleSignIn from '../components/GoogleSignIn'
import { useNavigate } from 'react-router-dom'
import HeroFallback from '../components/HeroFallback'
import { useToast } from '../components/Toast'
import { useTheme } from '../theme/ThemeProvider'
import { useDeviceProfile } from '../three/useDeviceProfile'
import {
  loginWithPassword,
  persistToken,
  sendOtp,
  verifyOtp,
  type Token,
} from '../lib/api'
import { friendlyMessage } from '../lib/errorMap'
import { playSuccess, playError } from '../lib/sound'

// three.js is ~600KB — load it only when the hero actually mounts.
const HeroScene3D = lazy(() => import('../three/HeroScene3D'))

type Mood = 'idle' | 'focus' | 'typing' | 'error' | 'success'
type Method = 'password' | 'otp'
type FriendlyError = { title: string; message: string; field?: 'identifier' | 'password' | 'otp' }

const METHOD_KEY = 'pms_method'
const REMEMBER_KEY = 'pms_remember'
const SOUND_KEY = 'pms_sound'

interface LoginPageProps {
  onAuthenticated: (token: Token) => void
}

/* -------------------------------------------------------------- */
/* Presentational bits                                            */
/* -------------------------------------------------------------- */

function BrandMark({ animated = true }: { animated?: boolean }) {
  return (
    <div className="relative grid h-11 w-11 place-items-center" aria-hidden>
      <motion.span
        className="absolute h-3.5 w-11 rounded-lg bg-gradient-to-br from-[#86efac] to-[#2E7D32] shadow-[0_8px_20px_-6px_rgba(46,125,50,0.9)]"
        animate={animated ? { rotate: 360 } : undefined}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.span
        className="absolute h-11 w-3.5 rounded-lg bg-gradient-to-br from-[#86efac] to-[#2E7D32] shadow-[0_8px_20px_-6px_rgba(46,125,50,0.9)]"
        animate={animated ? { rotate: -360 } : undefined}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      All systems operational
    </span>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="glass grid h-10 w-10 place-items-center rounded-xl text-ink transition hover:scale-105"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}

function HeroSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-40 w-40 animate-pulse rounded-3xl bg-gradient-to-br from-[#4CAF50]/40 to-[#14b8a6]/30" />
    </div>
  )
}

/* -------------------------------------------------------------- */
/* Page                                                           */
/* -------------------------------------------------------------- */

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const { push } = useToast()
  const { useWebGL, isTouch } = useDeviceProfile()

  const [method, setMethod] = useState<Method>(() =>
    localStorage.getItem(METHOD_KEY) === 'otp' ? 'otp' : 'password',
  )
  const [mood, setMood] = useState<Mood>('idle')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [passwordError, setPasswordError] = useState<FriendlyError | null>(null)
  const [otpError, setOtpError] = useState<FriendlyError | null>(null)
  const navigate = useNavigate()
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) === 'on')

  const typingTimer = useRef<number | null>(null)

  /* ---- mood helpers (drive the hero scene) ---- */
  function bumpTyping() {
    setMood('typing')
    if (typingTimer.current) window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => setMood('idle'), 900)
  }
  function flashError() {
    setMood('error')
    window.setTimeout(() => setMood('idle'), 700)
  }
  function beep(kind: 'success' | 'error') {
    if (localStorage.getItem(SOUND_KEY) === 'on') (kind === 'success' ? playSuccess : playError)()
  }

  // remember last-used tab
  useEffect(() => {
    localStorage.setItem(METHOD_KEY, method)
  }, [method])

  function completeSignIn(token: Token) {
    persistToken(token)
    setMood('success')
    beep('success')
    push({ type: 'success', title: 'Welcome back!', message: 'Signing you in…' })
    window.setTimeout(() => onAuthenticated(token), 850)
  }

  /* ---- password ---- */
  async function handlePasswordSubmit(values: PasswordSubmit) {
    setPasswordLoading(true)
    setPasswordError(null)
    setMood('typing')
    try {
      const token = await loginWithPassword(values.identifier, values.password)
      if (values.remember) localStorage.setItem(REMEMBER_KEY, values.identifier)
      else localStorage.removeItem(REMEMBER_KEY)
      completeSignIn(token)
    } catch (e) {
      const msg = friendlyMessage(e, 'login')
      beep('error')
      // Map to a field for focus: wrong password vs. unknown account.
      const field = /password/i.test(msg.message) ? 'password' : 'identifier'
      setPasswordError({ ...msg, field })
      flashError()
      push({ type: 'error', title: msg.title, message: msg.message })
    } finally {
      setPasswordLoading(false)
    }
  }

  /* ---- otp ---- */
  async function handleOtpSend(identifier: string): Promise<boolean> {
    setOtpSending(true)
    setOtpError(null)
    try {
      const res = await sendOtp(identifier)
      push({
        type: 'success',
        title: 'Code sent',
        message: res.message || 'Check your inbox for the 6-digit code.',
      })
      return true
    } catch (e) {
      setOtpError(friendlyMessage(e, 'otp-send'))
      flashError()
      return false
    } finally {
      setOtpSending(false)
    }
  }

  async function handleOtpVerify(identifier: string, code: string) {
    setOtpVerifying(true)
    setOtpError(null)
    try {
      const token = await verifyOtp(identifier, code)
      completeSignIn(token)
    } catch (e) {
      const msg = friendlyMessage(e, 'otp-verify')
      setOtpError({ ...msg, field: 'otp' })
      beep('error')
      flashError()
    } finally {
      setOtpVerifying(false)
    }
  }

  /* ---- google ---- */
  function handleGoogleError(e: unknown) {
    const msg = friendlyMessage(e, 'google')
    beep('error')
    flashError()
    push({ type: 'error', title: msg.title, message: msg.message })
  }

  const tabs: TabDef[] = useMemo(
    () => [
      { id: 'password', label: 'Password', icon: KeyRound },
      { id: 'otp', label: 'OTP', icon: ShieldCheck },
    ],
    [],
  )

  return (
    <div className="relative min-h-[100dvh] w-full">
      <Background />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-ink">PharmaMS</p>
            <p className="text-[11px] text-muted">Pharmacy Management System</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Split layout: hero 55% / card 45% on desktop */}
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1500px] grid-cols-1 lg:grid-cols-[55%_45%]">
        {/* Hero */}
        <section className="relative h-[34vh] min-h-[220px] overflow-hidden lg:h-auto lg:min-h-0">
          {useWebGL ? (
            <Suspense fallback={<HeroSkeleton />}>
              <HeroScene3D mood={mood} />
            </Suspense>
          ) : (
            <HeroFallback />
          )}
        </section>

        {/* Card column */}
        <section className="relative flex items-center justify-center px-4 pb-12 lg:px-10">
          <GlassCard disabledTilt={isTouch} className="-mt-12 w-full max-w-md p-6 sm:p-8 lg:mt-0">
            <div className="mb-5 flex items-center justify-between">
              <StatusBadge />
              <span className="text-[11px] font-medium text-muted">v1.0</span>
            </div>

            <BrandMark animated={false} />
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to PharmaMS to continue.</p>

            <div className="mt-6">
              <TabSwitcher tabs={tabs} value={method} onChange={(id) => setMethod(id as Method)} />
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait" initial={false}>
                {method === 'password' ? (
                  <motion.div
                    key="method-password"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22 }}
                  >
                    <PasswordForm
                      onSubmit={handlePasswordSubmit}
                      loading={passwordLoading}
                      serverError={passwordError}
                      onDismissError={() => setPasswordError(null)}
                      onFieldFocus={(f) => setMood(f ? 'focus' : 'idle')}
                      onTyping={bumpTyping}
                      defaultRemember={!!localStorage.getItem(REMEMBER_KEY)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="method-otp"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22 }}
                  >
                    <OtpForm
                      onSend={handleOtpSend}
                      onVerify={handleOtpVerify}
                      sending={otpSending}
                      verifying={otpVerifying}
                      serverError={otpError ? { title: otpError.title, message: otpError.message } : null}
                      onDismissError={() => setOtpError(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-line/40" />
              <span className="text-xs font-medium text-muted">or continue with</span>
              <span className="h-px flex-1 bg-line/40" />
            </div>

            <GoogleSignIn onToken={completeSignIn} onError={handleGoogleError} text="signin_with" />
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line/50 bg-white/50 text-[15px] font-semibold text-ink transition hover:border-[#2E7D32]/60 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
            >
              New user? Sign up
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
              By continuing you agree to the PharmaMS terms and privacy policy.
              <br />
              Need help?{' '}
              <button
                type="button"
                className="font-semibold text-[#2E7D32] hover:underline dark:text-[#81C784]"
                onClick={() =>
                  push({
                    type: 'info',
                    title: 'Trouble signing in?',
                    message: 'Try password login, an OTP, or contact your pharmacy administrator.',
                  })
                }
              >
                Trouble signing in?
              </button>
            </p>
          </GlassCard>
        </section>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {mood === 'success' && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40 bg-gradient-to-br from-[#052e16]/30 to-[#0f766e]/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Sound toggle (off by default) */}
      <button
        type="button"
        onClick={() => {
          setSoundOn((v) => {
            const next = !v
            localStorage.setItem(SOUND_KEY, next ? 'on' : 'off')
            return next
          })
        }}
        aria-pressed={soundOn}
        className="glass absolute bottom-4 right-4 z-30 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-muted transition hover:text-ink"
      >
        Sound {soundOn ? 'on' : 'off'}
      </button>
    </div>
  )
}
