import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { IconButton } from './Button'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** Which edge it slides from. */
  side?: 'right' | 'left' | 'bottom'
}

/**
 * Side sheet / bottom sheet for detail views and the mobile cart. Uses Radix
 * Dialog for the focus trap + Escape handling, with a sliding entrance.
 */
export default function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-slate-900/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex flex-col border border-line/30 bg-surface/97 shadow-card backdrop-blur-2xl focus:outline-none dark:bg-surface-2/97 dark:shadow-card-dark',
            side === 'right' && 'inset-y-0 right-0 w-[min(28rem,100vw)] animate-slide-right rounded-l-3xl',
            side === 'left' && 'inset-y-0 left-0 w-[min(20rem,100vw)] animate-slide-left rounded-r-3xl',
            side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] animate-slide-up rounded-t-3xl',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line/20 p-5">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close panel">
                <X className="h-5 w-5" />
              </IconButton>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-5">{children}</div>

          {footer && <div className="border-t border-line/20 p-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
