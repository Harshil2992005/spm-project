import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Medicines from './pages/Medicines'
import Patients from './pages/Patients'
import Prescriptions from './pages/Prescriptions'
import Billing from './pages/Billing'
import MyRecords from './pages/MyRecords'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
    },
    secondary: {
      main: '#1976d2',
    },
  },
})

const ProtectedLayout = () => {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Layout />
}

const RequireManager = ({ children }) => {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (user.role_name !== 'Manager') {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="medicines" element={<Medicines />} />
              <Route path="patients" element={<RequireManager><Patients /></RequireManager>} />
              <Route path="prescriptions" element={<RequireManager><Prescriptions /></RequireManager>} />
              <Route path="billing" element={<RequireManager><Billing /></RequireManager>} />
              <Route path="records" element={<MyRecords />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App