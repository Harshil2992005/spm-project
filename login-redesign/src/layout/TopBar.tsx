import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import Dropdown, { DropdownItem, DropdownLabel, DropdownSeparator } from '../components/ui/Dropdown'
import Tooltip from '../components/ui/Tooltip'
import { cn } from '../lib/cn'
import { initials } from '../lib/format'
import { useAuth } from '../state/AuthProvider'
import { useTheme } from '../theme/ThemeProvider'
import NotificationMenu from './NotificationMenu'

const META: Record<string, { title: string; crumb: string }> = {
  '/': { title: 'Dashboard', crumb: 'Overview' },
  '/medicines': { title: 'Medicine Management', crumb: 'Inventory' },
  '/patients': { title: 'Patients', crumb: 'People' },
  '/prescriptions': { title: 'Prescriptions', crumb: 'Clinical' },
  '/billing': { title: 'Billing', crumb: 'Point of sale' },
}

interface TopBarProps {
  onOpenSearch: () => void
  onOpenMobileNav: () => void
}

export default function TopBar({ onOpenSearch, onOpenMobileNav }: TopBarProps) {
  const { pathname } = useLocation()
  const { user, displayName, isManager, signOut } = useAuth()
  const { theme, toggle } = useTheme()

  const meta = META[pathname] ?? { title: 'PharmaMS', crumb: 'Home' }
  const userInitials = initials(user?.first_name, user?.last_name, 'HP')

  return (
    <header className="sticky top-0 z-30">
      <div className="glass flex items-center gap-3 rounded-2xl px-3 py-2.5 sm:px-4">
        {/* Mobile nav trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden lg:block">
          <BrandMark size={30} animated={false} />
        </div>

        {/* Title + breadcrumb */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[11px] font-medium text-muted">
            <span>PharmaMS</span>
            <ChevronRight className="h-3 w-3" />
            <span>{meta.crumb}</span>
          </div>
          <h1 className="truncate font-display text-base font-bold leading-tight text-ink sm:text-lg">
            {meta.title}
          </h1>
        </div>

        {/* Search */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="group hidden items-center gap-2 rounded-xl border border-line/30 bg-surface-2/60 px-3 py-2 text-sm text-muted transition hover:border-brand-500/50 hover:text-ink md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="ml-2 rounded-md border border-line/40 bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            Ctrl K
          </kbd>
        </button>
        <Tooltip label="Search (Ctrl/Cmd + K)">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
        </Tooltip>

        {/* Notifications */}
        <NotificationMenu />

        {/* User */}
        <Dropdown
          trigger={
            <button
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-xl p-1 pr-2 outline-none transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-brand-500/60 dark:hover:bg-white/10"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
                {userInitials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold capitalize leading-tight text-ink">{displayName}</span>
                <span className="block text-[11px] text-muted">{isManager ? 'Manager' : 'Staff'}</span>
              </span>
            </button>
          }
        >
          <DropdownLabel>
            {displayName || 'Signed in'}
          </DropdownLabel>
          <DropdownSeparator />
          <DropdownItem icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} onSelect={toggle}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </DropdownItem>
          <DropdownItem icon={<Bell className="h-4 w-4" />} onSelect={onOpenSearch}>
            Search
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem
            icon={<LogOut className="h-4 w-4" />}
            danger
            onSelect={() => {
              signOut()
            }}
          >
            Logout
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Green gradient accent line under the bar */}
      <div
        aria-hidden
        className={cn(
          'mx-3 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent sm:mx-4',
        )}
      />

      <Link to="/" className="sr-only">
        Home
      </Link>
    </header>
  )
}
