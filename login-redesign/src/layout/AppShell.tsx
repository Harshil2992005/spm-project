import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BrandMark from '../components/BrandMark'
import Drawer from '../components/ui/Drawer'
import { cn } from '../lib/cn'
import { useLocalStorage } from '../hooks/useUtils'
import { useAuth } from '../state/AuthProvider'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileTabBar from './MobileTabBar'
import CommandPalette from './CommandPalette'
import CartDrawer from '../components/CartDrawer'
import { navItemsFor } from './nav'

/** Mobile slide-over navigation. */
function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { isManager, signOut } = useAuth()
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Menu" side="left">
      <div className="flex items-center gap-3 pb-4">
        <BrandMark size={34} />
        <div>
          <p className="font-display text-base font-bold text-ink">PharmaMS</p>
          <p className="text-[11px] text-muted">{isManager ? 'Manager' : 'Staff'}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {navItemsFor(isManager).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors',
                  isActive ? 'bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-glow' : 'text-ink-soft hover:bg-black/5 dark:hover:bg-white/10',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={signOut}
        className="mt-6 w-full rounded-2xl border border-danger/30 py-3 text-sm font-semibold text-danger transition hover:bg-danger/10"
      >
        Logout
      </button>
    </Drawer>
  )
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useLocalStorage('pms_sidebar_collapsed', false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState(false)
  const location = useLocation()

  // Global Ctrl/Cmd+K shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((s) => !s)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative min-h-screen w-full">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-brand-50/60 dark:from-[#050b14] dark:via-[#060d1a] dark:to-[#07211a]" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-teal/15 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] gap-3">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 pb-24 lg:pb-3">
          <TopBar onOpenSearch={() => setSearch(true)} onOpenMobileNav={() => setMobileNav(true)} />

          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <MobileTabBar />
      <MobileNav open={mobileNav} onOpenChange={setMobileNav} />
      <CommandPalette open={search} onOpenChange={setSearch} />
      <CartDrawer />
    </div>
  )
}
