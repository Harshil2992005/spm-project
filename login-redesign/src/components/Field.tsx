import { forwardRef, type ComponentType, type InputHTMLAttributes, type ReactNode } from 'react'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  id: string
  icon?: ComponentType<{ className?: string }>
  /** Rendered at the right edge (e.g. show/hide password toggle). */
  rightAddon?: ReactNode
  /** Small helper / error text below the field. */
  hint?: string
  error?: boolean
  className?: string
}

/**
 * Floating-label input with a leading icon, focus ring and inline messaging.
 * Uncontrolled by default so it composes directly with react-hook-form's
 * `register()` (which supplies name/onChange/onBlur/ref).
 */
const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, id, icon: Icon, rightAddon, hint, error = false, className = '', ...inputProps },
  ref,
) {
  return (
    <div className={className}>
      <div
        className={`group relative rounded-2xl border bg-white/70 transition-all focus-within:shadow-[0_0_0_4px_rgba(76,175,80,0.18)] dark:bg-white/5 ${
          error
            ? 'border-red-400/80 focus-within:border-red-400'
            : 'border-line/40 hover:border-line/70 focus-within:border-[#4CAF50]'
        }`}
      >
        {Icon && (
          <span
            className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
              error ? 'text-red-400' : 'text-muted group-focus-within:text-[#2E7D32] dark:group-focus-within:text-[#81C784]'
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}

        <input
          id={id}
          ref={ref}
          placeholder=" "
          aria-invalid={error}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`peer h-14 w-full rounded-2xl bg-transparent pb-2 pt-6 text-[15px] text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            Icon ? 'pl-12' : 'pl-4'
          } ${rightAddon ? 'pr-12' : 'pr-4'}`}
          {...inputProps}
        />

        <label
          htmlFor={id}
          className={`pointer-events-none absolute origin-left transition-all duration-200 ${
            Icon ? 'left-12' : 'left-4'
          } top-1/2 -translate-y-1/2 text-[15px] text-muted peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wide peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wide`}
        >
          {label}
        </label>

        {rightAddon && (
          <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">{rightAddon}</span>
        )}
      </div>

      {hint && (
        <p id={`${id}-hint`} className={`mt-1.5 pl-1 text-xs ${error ? 'text-red-500' : 'text-muted'}`}>
          {hint}
        </p>
      )}
    </div>
  )
})

export default Field
