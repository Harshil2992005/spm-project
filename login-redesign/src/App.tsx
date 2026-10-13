import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ThemeProvider } from './theme/ThemeProvider'
import { PreferencesProvider } from './state/Preferences'
import { AuthProvider, useAuth } from './state/AuthProvider'
import { CartProvider } from './state/Cart'
import { ToastProvider } from './components/Toast'
import { TooltipProvider } from './components/ui/Tooltip'
import AppShell from './layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MedicinesPage from './pages/medicines/MedicinesPage'
import RegisterPage from './pages/RegisterPage'
import PatientsPage from './pages/patients/PatientsPage'
import PrescriptionsPage from './pages/prescriptions/PrescriptionsPage'
import BillingPage from './pages/billing/BillingPage'
import OrdersPage from './pages/orders/OrdersPage'
import type { Token } from './lib/api'

function FullScreenLoader() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-600" />
        <p className="text-sm text-muted">Loading PharmaMS…</p>
      </div>
    </div>
  )
}

/** Renders the login screen and hands the fresh token to the auth context. */
function LoginRoute() {
  const { token, signIn } = useAuth()
  const navigate = useNavigate()
  if (token) return <Navigate to="/" replace />
  return (
    <LoginPage
      onAuthenticated={(t: Token) => {
        signIn(t)
        navigate('/', { replace: true })
      }}
    />
  )
}

/** Same sign-up page, handing the fresh token to the auth context. */
function RegisterRoute() {
  const { token, signIn } = useAuth()
  const navigate = useNavigate()
  if (token) return <Navigate to="/" replace />
  return (
    <RegisterPage
      onAuthenticated={(t: Token) => {
        signIn(t)
        navigate('/', { replace: true })
      }}
    />
  )
}

/** Pages whose API is Manager-only; customers are sent to Medicines instead of seeing 403s. */
function ManagerOnly({ children }: { children: JSX.Element }) {
  const { isManager, user } = useAuth()
  if (!user) return null
  return isManager ? children : <Navigate to="/medicines" replace />
}

/** Gate for the authenticated application shell. */
function ProtectedShell() {
  const { token, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!token) return <Navigate to="/login" replace />
  return <AppShell />
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <PreferencesProvider>
            <TooltipProvider>
              <ToastProvider>
                <AuthProvider>
                  <CartProvider>
                    <Routes>
                      <Route path="/login" element={<LoginRoute />} />
                      <Route path="/register" element={<RegisterRoute />} />
                      <Route element={<ProtectedShell />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/medicines" element={<MedicinesPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/patients" element={<ManagerOnly><PatientsPage /></ManagerOnly>} />
                        <Route path="/prescriptions" element={<ManagerOnly><PrescriptionsPage /></ManagerOnly>} />
                        <Route path="/billing" element={<ManagerOnly><BillingPage /></ManagerOnly>} />
                      </Route>
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </CartProvider>
                </AuthProvider>
              </ToastProvider>
            </TooltipProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
