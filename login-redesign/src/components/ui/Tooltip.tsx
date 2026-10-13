import * as RT from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

/** Wrap the app once so every <Tooltip> shares timing. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RT.Provider delayDuration={220} skipDelayDuration={300}>
      {children}
    </RT.Provider>
  )
}

interface TooltipProps {
  label: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  asChild?: boolean
}

/** Accessible tooltip (keyboard focus + Escape friendly). */
export default function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          className="z-[70] max-w-xs rounded-lg border border-line/30 bg-slate-900/95 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg dark:bg-slate-800"
        >
          {label}
          <RT.Arrow className="fill-slate-900/95 dark:fill-slate-800" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  )
}
