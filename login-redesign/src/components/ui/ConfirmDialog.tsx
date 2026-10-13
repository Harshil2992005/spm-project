import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'
import { Input } from './Input'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  /** Require the user to type this exact string (e.g. the medicine code). */
  requireText?: string
  loading?: boolean
  onConfirm: () => void
}

/**
 * Destructive-action confirmation. For high-impact deletes, set `requireText`
 * so the user must type the record's code before the button enables.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  requireText,
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  const canConfirm = !requireText || typed.trim().toLowerCase() === requireText.toLowerCase()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span
          className={
            tone === 'danger'
              ? 'grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-danger/12 text-danger'
              : 'grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-500/12 text-brand-600'
          }
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-soft">{message}</p>
      </div>

      {requireText && (
        <div className="mt-5">
          <Input
            id="confirm-text"
            label={`Type "${requireText}" to confirm`}
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
            error={typed.length > 0 && !canConfirm}
            hint={typed.length > 0 && !canConfirm ? 'Does not match' : undefined}
          />
        </div>
      )}
    </Modal>
  )
}
