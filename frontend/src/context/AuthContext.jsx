import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pms_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const response = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('pms_token', response.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
    localStorage.setItem('pms_user', JSON.stringify(me.data))
    return me.data
  }

  const requestOtp = async (identifier) => {
    const response = await api.post('/auth/request-otp', { identifier })
    return response.data
  }

  const verifyOtp = async (username, otp) => {
    const response = await api.post('/auth/verify-otp', { username, otp })
    localStorage.setItem('pms_token', response.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
    localStorage.setItem('pms_user', JSON.stringify(me.data))
    return me.data
  }

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload)
    return response.data
  }

  const googleLogin = async (credential) => {
    const response = await api.post('/auth/google', { credential })
    localStorage.setItem('pms_token', response.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
    localStorage.setItem('pms_user', JSON.stringify(me.data))
    return me.data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pms_token')
    localStorage.removeItem('pms_user')
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, login, requestOtp, verifyOtp, register, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}