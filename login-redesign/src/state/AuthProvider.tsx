import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearToken,
  getMe,
  getToken,
  persistToken,
  UNAUTHORIZED_EVENT,
  type Token,
} from '../lib/api'
import type { AuthUser } from '../lib/types'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  loading: boolean
  isManager: boolean
  displayName: string
  signIn: (token: Token) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(!!getToken())

  // Load the current user whenever we have a token.
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getMe()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .catch(() => {
        if (!cancelled) {
          clearToken()
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // React to server-side 401s from anywhere in the app.
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const signIn = useCallback((t: Token) => {
    persistToken(t)
    setToken(t.access_token)
  }, [])

  const signOut = useCallback(() => {
    clearToken()
    setToken(null)
    setUser(null)
  }, [])

  const isManager = user ? user.role_name === 'Manager' || user.role_id === 1 : false
  const displayName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username
    : 'User'

  const value = useMemo(
    () => ({ token, user, loading, isManager, displayName, signIn, signOut }),
    [token, user, loading, isManager, displayName, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
