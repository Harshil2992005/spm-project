import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react'
import { z } from 'zod'
import Field from './Field'
import PrimaryButton from './PrimaryButton'

const schema = z.object({
  identifier: z.string().min(1, 'Enter your username or email'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export interface PasswordSubmit {
  identifier: string
  password: string
  remember: boolean
}

export interface ServerError {
  title: string
  message: string
  field?: 'identifier' | 'password' | 'otp'
}

interface PasswordFormProps {
  onSubmit: (values: PasswordSubmit) => void
  loading?: boolean
  success?: boolean
  serverError?: { title: string; message: string; field?: 'identifier' | 'password' | 'otp' } | null
  onDismissError?: () => void
  /** Notifies the hero scene which field is focused (for the delight reaction). */
  onFieldFocus?: (field: 'identifier' | 'password' | null) => void
  /** Fired on each keystroke so the hero can pulse. */
  onTyping?: () => void
  defaultRemember?: boolean
}

export default function PasswordForm({
  onSubmit,
  loading = false,
  success = false,
  serverError,
  onDismissError,
  onFieldFocus,
  onTyping,
  defaultRemember = false,
}: PasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [remember, setRemember] = useState(defaultRemember)

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, touchedFields },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { identifier: '', password: '' },
  })

  const identifier = watch('identifier')

  // On a server error, move focus to the relevant field.
  useEffect(() => {
    if (serverError?.field === 'identifier' || serverError?.field === 'password') {
      setFocus(serverError.field)
    }
  }, [serverError, setFocus])

  const submit = handleSubmit((values) => onSubmit({ ...values, remember }))

  return (
    <form onSubmit={submit} noValidate className="space-y-3.5">
      <AnimatePresence initial={false}>
        {serverError && (
          <motion.div
            key={serverError.message}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -6, 6, 0] }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
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

      <Field
        id="identifier"
        label="Username or E-mail"
        type="text"
        inputMode="email"
        autoComplete="username"
        autoFocus
        icon={identifier.includes('@') ? Mail : User}
        error={!!errors.identifier}
        hint={touchedFields.identifier && errors.identifier ? errors.identifier.message : undefined}
        onFocus={() => onFieldFocus?.('identifier')}
        {...register('identifier', {
          onChange: () => onTyping?.(),
          onBlur: () => onFieldFocus?.(null),
        })}
      />

      <Field
        id="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        icon={Lock}
        error={!!errors.password}
        hint={touchedFields.password && errors.password ? errors.password.message : undefined}
        onFocus={() => onFieldFocus?.('password')}
        onKeyUp={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
        onKeyDown={(e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false)}
        {...register('password', {
          onChange: () => onTyping?.(),
          onBlur: () => onFieldFocus?.(null),
        })}
        rightAddon={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="rounded-lg p-2 text-muted transition hover:text-ink"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        }
      />

      {capsLock && (
        <p className="flex items-center gap-1.5 pl-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Caps Lock is on
        </p>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-muted">
          <span className="relative flex h-5 w-5 items-center justify-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-line/60 bg-white/70 transition-colors checked:border-[#2E7D32] checked:bg-[#2E7D32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4CAF50]/50 dark:bg-white/10"
            />
            <motion.svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                initial={false}
                animate={{ pathLength: remember ? 1 : 0 }}
                transition={{ duration: 0.25 }}
              />
            </motion.svg>
          </span>
          Remember this device
        </label>

        <button
          type="button"
          onClick={() => setFocus('identifier')}
          className="text-sm font-medium text-[#2E7D32] transition hover:underline dark:text-[#81C784]"
        >
          Forgot password?
        </button>
      </div>

      <PrimaryButton type="submit" loading={loading}>
        Sign In
      </PrimaryButton>
    </form>
  )
}
