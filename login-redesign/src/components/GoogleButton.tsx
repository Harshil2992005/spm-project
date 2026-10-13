import { Loader2 } from 'lucide-react'

interface GoogleButtonProps {
  onClick: () => void
  loading?: boolean
  /** Disabled when the provider is unavailable. */
  disabled?: boolean
  /** Tooltip text explaining why it is disabled. */
  disabledReason?: string
}

/** Official multi-colour Google "G" mark. */
function GoogleG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.2C41.4 35.3 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  )
}

/**
 * "Continue with Google" button — glassy neutral surface that lifts on hover.
 * Shows a tooltip when disabled (provider unavailable).
 */
export default function GoogleButton({
  onClick,
  loading = false,
  disabled = false,
  disabledReason = 'Google sign-in is temporarily unavailable.',
}: GoogleButtonProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-describedby={disabled ? 'google-disabled-reason' : undefined}
        className={`flex h-12 w-full items-center justify-center gap-3 rounded-2xl border text-[15px] font-semibold transition-all ${
          disabled
            ? 'cursor-not-allowed border-line/30 bg-white/40 text-muted/60 dark:bg-white/5'
            : 'border-line/40 bg-white/80 text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-md dark:bg-white/10 dark:hover:bg-white/15'
        }`}
      >
        {loading ? (
          <span className="h-5 w-5 animate-[g-spin_0.8s_linear_infinite] rounded-full border-2 border-line border-t-transparent" />
        ) : (
          <GoogleG className={`h-5 w-5 ${disabled ? 'opacity-40 grayscale' : ''}`} />
        )}
        <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
      </button>

      {disabled && (
        <span
          id="google-disabled-reason"
          role="tooltip"
          className="pointer-events-none absolute -top-1 left-1/2 z-20 w-max max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-xl bg-slate-900/95 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        >
          {disabledReason}
        </span>
      )}
    </div>
  )
}
