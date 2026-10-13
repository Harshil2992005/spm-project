import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { IconButton } from './Button'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  /** Hide the default close button (rarely needed). */
  hideClose?: boolean
}

/**
 * Glass modal with depth. Radix handles focus trap, scroll lock and Escape.
 */
export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-slate-900/45 backdrop-blur-[3px]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 animate-scale-in rounded-3xl border border-line/30 bg-surface/95 p-6 shadow-card backdrop-blur-2xl focus:outline-none dark:bg-surface-2/95 dark:shadow-card-dark',
            SIZES[size],
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-xl font-bold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {!hideClose && (
              <Dialog.Close asChild>
                <IconButton label="Close dialog">
                  <X className="h-5 w-5" />
                </IconButton>
              </Dialog.Close>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">{children}</div>

          {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
