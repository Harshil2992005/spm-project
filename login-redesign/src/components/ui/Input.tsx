import {
  forwardRef,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'

type IconType = ComponentType<{ className?: string }>

/** Shared floating-label shell classes. */
function shell(error: boolean) {
  return cn(
    'group relative rounded-2xl border bg-white/70 transition-all dark:bg-white/5',
    'focus-within:shadow-[0_0_0_4px_rgba(76,175,80,0.18)]',
    error ? 'border-danger/80 focus-within:border-danger' : 'border-line/40 hover:border-line/70 focus-within:border-brand-500',
  )
}
function floatingLabel(withIcon: boolean) {
  return cn(
    'pointer-events-none absolute origin-left transition-all duration-200',
    withIcon ? 'left-12' : 'left-4',
    'top-1/2 -translate-y-1/2 text-[15px] text-muted',
    'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wide',
    'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wide',
  )
}
function hintClass(error: boolean) {
  return cn('mt-1.5 px-1 text-xs', error ? 'text-danger' : 'text-muted')
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string | boolean
  icon?: IconType
  rightAddon?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon: Icon, rightAddon, containerClassName, className, id, ...rest },
  ref,
) {
  const invalid = Boolean(error)
  return (
    <div className={containerClassName}>
      <div className={shell(invalid)}>
        {Icon && (
          <span
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2',
              invalid
                ? 'text-danger'
                : 'text-muted group-focus-within:text-brand-600 dark:group-focus-within:text-brand-300',
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <input
          id={id}
          ref={ref}
          placeholder=" "
          aria-invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={cn(
            'peer h-14 w-full rounded-2xl bg-transparent pb-2 pt-6 text-[15px] text-ink outline-none disabled:cursor-not-allowed disabled:opacity-60',
            Icon ? 'pl-12' : 'pl-4',
            rightAddon ? 'pr-12' : 'pr-4',
            className,
          )}
          {...rest}
        />
        <label htmlFor={id} className={floatingLabel(!!Icon)}>
          {label}
        </label>
        {rightAddon && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightAddon}</span>}
      </div>
      {(hint || (typeof error === 'string' && error)) && (
        <p id={hint ? `${id}-hint` : undefined} className={hintClass(invalid)}>
          {typeof error === 'string' && error ? error : hint}
        </p>
      )}
    </div>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string | boolean
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, containerClassName, className, id, children, ...rest },
  ref,
) {
  const invalid = Boolean(error)
  return (
    <div className={containerClassName}>
      <div className={shell(invalid)}>
        <select
          id={id}
          ref={ref}
          aria-invalid={invalid}
          className={cn(
            'h-14 w-full cursor-pointer appearance-none rounded-2xl bg-transparent px-4 pb-1 pt-5 text-[15px] text-ink outline-none',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-4 top-3 text-[11px] font-semibold uppercase tracking-wide text-muted"
        >
          {label}
        </label>
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {(hint || (typeof error === 'string' && error)) && (
        <p className={hintClass(invalid)}>{typeof error === 'string' && error ? error : hint}</p>
      )}
    </div>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  hint?: string
  error?: string | boolean
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, containerClassName, className, id, ...rest },
  ref,
) {
  const invalid = Boolean(error)
  return (
    <div className={containerClassName}>
      <div className={shell(invalid)}>
        <textarea
          id={id}
          ref={ref}
          placeholder=" "
          aria-invalid={invalid}
          className={cn(
            'peer min-h-[92px] w-full resize-y rounded-2xl bg-transparent px-4 pb-3 pt-7 text-[15px] text-ink outline-none',
            className,
          )}
          {...rest}
        />
        <label htmlFor={id} className={cn(floatingLabel(false), 'top-4')}>
          {label}
        </label>
      </div>
      {(hint || (typeof error === 'string' && error)) && (
        <p className={hintClass(invalid)}>{typeof error === 'string' && error ? error : hint}</p>
      )}
    </div>
  )
})
