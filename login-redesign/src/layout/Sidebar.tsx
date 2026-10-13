import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, LogOut, Moon, Sun } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import Dropdown, { DropdownItem, DropdownSeparator } from '../components/ui/Dropdown'
import Tooltip from '../components/ui/Tooltip'
import { cn } from '../lib/cn'
import { initials } from '../lib/format'
import { useAuth } from '../state/AuthProvider'
import { useTheme } from '../theme/ThemeProvider'
import { navItemsFor } from './nav'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, displayName, isManager, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const userInitials = initials(user?.first_name, user?.last_name, 'HP')

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 p-3 lg:block',
        collapsed ? 'w-[92px]' : 'w-[268px]',
      )}
    >
      <div className="glass gradient-border flex h-full flex-col rounded-3xl p-3">
        {/* Brand */}
        <div className={cn('flex items-center gap-3 px-1 pb-4 pt-2', collapsed && 'justify-center')}>
          <BrandMark size={36} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold leading-tight text-ink">PharmaMS</p>
              <p className="truncate text-[11px] text-muted">Pharmacy Management</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {navItemsFor(isManager).map((item) => {
            const Icon = item.icon
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/60',
                    collapsed && 'justify-center px-0',
                    isActive ? 'text-white' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 shadow-glow"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </span>
                    {!collapsed && (
                      <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
            return collapsed ? (
              <Tooltip key={item.to} label={item.label} side="right">
                {link}
              </Tooltip>
            ) : (
              link
            )
          })}
        </nav>

        {/* User card */}
        <div className="pt-3">
          {collapsed ? (
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Account menu"
                  className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                >
                  {userInitials}
                </button>
              }
            >
              <DropdownItem icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} onSelect={toggle}>
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<LogOut className="h-4 w-4" />} danger onSelect={signOut}>
                Logout
              </DropdownItem>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-line/30 bg-surface/60 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white">
                {userInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold capitalize text-ink">{displayName}</p>
                <span className="chip chip-info mt-0.5">{isManager ? 'Manager' : 'Staff'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={toggle}
                  aria-label="Toggle theme"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Logout"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-muted transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/10"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </div>
    </aside>
  )
}
