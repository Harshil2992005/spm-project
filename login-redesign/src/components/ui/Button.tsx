import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  success?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary:
    'border border-line/40 bg-surface/70 text-ink shadow-key backdrop-blur hover:bg-surface',
  ghost: 'text-ink-soft hover:bg-black/5 dark:hover:bg-white/10',
  subtle: 'bg-surface-2 text-ink-soft hover:bg-surface-3',
  danger:
    'text-white bg-gradient-to-b from-red-500 to-red-600 shadow-[0_8px_18px_-8px_rgb(229_72 77/0.7)] hover:from-red-500 hover:to-red-700',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-xl',
  md: 'h-11 px-4 text-sm rounded-xl2',
  lg: 'h-12 px-5 text-[15px] rounded-2xl',
}

/**
 * The workhorse button. `primary` gets the 3D brand treatment (via .btn-primary)
 * while the others stay flat-but-dimensional. Handles loading → success morphs
 * and keeps its width stable so layout never jumps.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    success = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isBusy = loading || success
  return (
    <button
      ref={ref}
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold outline-none transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        size === 'sm' && 'h-9 px-3 text-[13px]',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-[15px]',
        'focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        className,
      )}
    >
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>
        {success ? <Check className="h-4 w-4" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      )}
    </button>
  )
})

export default Button

/** Square icon-only button with an accessible label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: Variant }
>(function IconButton({ label, variant = 'ghost', className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid h-9 w-9 place-items-center rounded-xl outline-none transition-colors',
        variant === 'ghost' && 'text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10',
        variant === 'subtle' && 'bg-surface-2 text-ink-soft hover:bg-surface-3',
        'focus-visible:ring-2 focus-visible:ring-brand-500/60',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
