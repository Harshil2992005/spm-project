import { ClipboardList, LayoutDashboard, Pill, Receipt, Users } from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
  /** Hidden from Customer accounts (the API would answer 403). */
  managerOnly?: boolean
}

/** Sidebar navigation — mirrors the existing app's routes exactly. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/medicines', label: 'Medicines', icon: Pill },
  { to: '/patients', label: 'Patients', icon: Users, managerOnly: true },
  { to: '/prescriptions', label: 'Prescriptions', icon: ClipboardList, managerOnly: true },
  { to: '/billing', label: 'Billing', icon: Receipt, managerOnly: true },
]

export const navItemsFor = (isManager: boolean): NavItem[] =>
  NAV_ITEMS.filter((n) => isManager || !n.managerOnly)
