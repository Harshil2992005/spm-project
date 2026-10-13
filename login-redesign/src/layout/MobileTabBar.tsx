import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import { navItemsFor } from './nav'
import { useAuth } from '../state/AuthProvider'

/** Bottom tab bar for phones (sidebar is hidden below lg). */
export default function MobileTabBar() {
  const { isManager } = useAuth()
  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl px-1 py-1.5 lg:hidden"
    >
      {navItemsFor(isManager).map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-xl transition-colors',
                    isActive && 'bg-brand-500/15',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
