import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react'
import Background from '../components/Background'
import GlassCard from '../components/GlassCard'
import Field from '../components/Field'
import PrimaryButton from '../components/PrimaryButton'
import GoogleSignIn from '../components/GoogleSignIn'
import { useToast } from '../components/Toast'
import { loginWithPassword, persistToken, registerUser, type Token } from '../lib/api'
import { friendlyMessage } from '../lib/errorMap'

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'Required'),
    last_name: z.string().trim().min(1, 'Required'),
    username: z
      .string()
      .trim()
      .min(3, 'At least 3 characters')
      .regex(/^[A-Za-z0-9._-]+$/, 'Letters, numbers, dot, dash and underscore only'),
    email: z.string().trim().email('Enter a valid e-mail address'),
    password: z.string().min(6, 'At least 6 characters'),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })

type FormValues = z.infer<typeof schema>

interface RegisterPageProps {
  onAuthenticated: (token: Token) => void
}

export default function RegisterPage({ onAuthenticated }: RegisterPageProps) {
  const { push } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [serverError, setServerError] = useState<{ title: string; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onBlur' })

  function finish(token: Token) {
    persistToken(token)
    push({ type: 'success', title: 'Welcome to PharmaMS!', message: 'Your account is ready.' })
    onAuthenticated(token)
  }

  const submit = handleSubmit(async (v) => {
    setLoading(true)
    setServerError(null)
    try {
      await registerUser({
        username: v.username,
        email: v.email,
        first_name: v.first_name,
        last_name: v.last_name,
        password: v.password,
      })
    } catch (e) {
      setServerError(friendlyMessage(e, 'register'))
      setLoading(false)
      return
    }
    try {
      finish(await loginWithPassword(v.username, v.password))
    } catch {
      // Account exists but auto sign-in failed - send them to the login page instead of an error.
      push({ type: 'success', title: 'Account created', message: 'Please sign in with your new password.' })
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  })

  const pwToggle = (
    <button
      type="button"
      onClick={() => setShowPw((s) => !s)}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:text-ink"
      aria-label={showPw ? 'Hide password' : 'Show password'}
    >
      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <div className="relative grid min-h-[100dvh] w-full place-items-center px-4 py-10">
      <Background />
      <GlassCard disabledTilt className="w-full max-w-lg p-6 sm:p-8">
        <Link to="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Create account</h1>
        <p className="mt-1 text-sm text-muted">Join PharmaMS to view your bills and prescriptions.</p>

        <form onSubmit={submit} noValidate className="mt-6 space-y-3.5">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-red-300/50 bg-red-50/80 px-3.5 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">{serverError.title}</p>
                <p className="mt-0.5 text-xs opacity-90">{serverError.message}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field id="first_name" label="First name" icon={User} autoComplete="given-name"
              error={!!errors.first_name} hint={errors.first_name?.message} {...register('first_name')} />
            <Field id="last_name" label="Last name" icon={User} autoComplete="family-name"
              error={!!errors.last_name} hint={errors.last_name?.message} {...register('last_name')} />
          </div>
          <Field id="username" label="Username" icon={User} autoComplete="username"
            error={!!errors.username} hint={errors.username?.message} {...register('username')} />
          <Field id="email" label="E-mail" type="email" icon={Mail} autoComplete="email"
            error={!!errors.email} hint={errors.email?.message} {...register('email')} />
          <Field id="password" label="Password" type={showPw ? 'text' : 'password'} icon={Lock}
            autoComplete="new-password" rightAddon={pwToggle}
            error={!!errors.password} hint={errors.password?.message} {...register('password')} />
          <Field id="confirm" label="Confirm password" type={showPw ? 'text' : 'password'} icon={Lock}
            autoComplete="new-password"
            error={!!errors.confirm} hint={errors.confirm?.message} {...register('confirm')} />

          <PrimaryButton type="submit" loading={loading}>
            <UserPlus className="h-4 w-4" />
            Create account
          </PrimaryButton>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line/40" />
          <span className="text-xs font-medium text-muted">or</span>
          <span className="h-px flex-1 bg-line/40" />
        </div>

        <GoogleSignIn
          text="signup_with"
          onToken={finish}
          onError={(e) => {
            const m = friendlyMessage(e, 'google')
            push({ type: 'error', title: m.title, message: m.message })
          }}
        />

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#2E7D32] hover:underline dark:text-[#81C784]">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}
