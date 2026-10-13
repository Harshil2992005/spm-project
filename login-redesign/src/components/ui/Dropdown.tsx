import * as DM from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

/** Radix-powered dropdown menu (keyboard + screen-reader correct). */
export default function Dropdown({ trigger, children, align = 'end', side = 'bottom', className }: DropdownProps) {
  return (
    <DM.Root>
      <DM.Trigger asChild>{trigger}</DM.Trigger>
      <DM.Portal>
        <DM.Content
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            'z-50 min-w-[200px] origin-top-right animate-pop rounded-2xl border border-line/30 bg-surface/95 p-1.5 shadow-card backdrop-blur-xl dark:bg-surface-2/95 dark:shadow-card-dark',
            className,
          )}
        >
          {children}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}

interface ItemProps {
  children: ReactNode
  icon?: ReactNode
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
  shortcut?: string
}

export function DropdownItem({ children, icon, onSelect, danger, disabled, shortcut }: ItemProps) {
  return (
    <DM.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none transition-colors',
        danger
          ? 'text-danger data-[highlighted]:bg-danger/10'
          : 'text-ink-soft data-[highlighted]:bg-brand-500/10 data-[highlighted]:text-ink',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {icon && <span className="grid h-4 w-4 place-items-center">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="text-[11px] text-muted">{shortcut}</span>}
    </DM.Item>
  )
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1.5 h-px bg-line/25" />
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{children}</DM.Label>
}
