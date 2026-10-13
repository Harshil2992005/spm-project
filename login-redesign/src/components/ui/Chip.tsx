import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ChipTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

interface ChipProps {
  tone?: ChipTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const TONE_CLASS: Record<ChipTone, string> = {
  ok: 'chip-ok',
  warn: 'chip-warn',
  danger: 'chip-danger',
  info: 'chip-info',
  neutral: 'chip-neutral',
}

/**
 * Status chip. Always pairs an icon with the label so status is never conveyed
 * by colour alone (WCAG 1.4.1).
 */
export default function Chip({ tone = 'neutral', icon, children, className }: ChipProps) {
  return (
    <span className={cn('chip', TONE_CLASS[tone], className)}>
      {icon}
      {children}
    </span>
  )
}
