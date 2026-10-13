import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import type { Medicine } from '../lib/types'
import { useLocalStorage } from '../hooks/useUtils'

export interface CartLine {
  medicine: Medicine
  quantity: number
}

interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (medicine: Medicine, qty?: number) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useLocalStorage<CartLine[]>('pms_cart', [])
  const [open, setOpen] = useLocalStorage<boolean>('pms_cart_open', false)

  const add = useCallback((medicine: Medicine, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.medicine.id === medicine.id)
      if (found) {
        const nextQty = Math.max(0, Math.min(found.quantity + qty, medicine.quantity_in_stock))
        return prev.map((l) => (l.medicine.id === medicine.id ? { ...l, quantity: nextQty } : l))
      }
      // Price/stock are held from the catalogue entry used when added.
      return [{ medicine, quantity: Math.max(1, Math.min(qty, medicine.quantity_in_stock)) }, ...prev]
    })
  }, [setLines])

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.medicine.id === id
            ? { ...l, quantity: Math.max(0, Math.min(qty, l.medicine.quantity_in_stock)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }, [setLines])

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.medicine.id !== id))
  }, [setLines])

  const clear = useCallback(() => setLines([]), [setLines])

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines])
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.medicine.unit_price * l.quantity, 0),
    [lines],
  )

  const value = useMemo(
    () => ({ lines, count, subtotal, open, setOpen, add, setQty, remove, clear }),
    [lines, count, subtotal, open, setOpen, add, setQty, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}