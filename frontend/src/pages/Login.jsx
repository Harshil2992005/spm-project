import React, { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress, Tabs, Tab,
  Divider,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { errorMessage } from '../services/api'

const Login = () => {
  const [mode, setMode] = useState('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleClientId, setGoogleClientId] = useState('')
  const googleBtnRef = useRef(null)
  const { login, requestOtp, verifyOtp, googleLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(identifier, password)
      navigate('/')
    } catch (err) {
      setError(errorMessage(err, 'Login failed. Check your username/e-mail and password.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestOtp = async (event) => {
    event.preventDefault()
    setError('')
    setOtpSent(false)
    setSubmitting(true)
    try {
      const name = identifier || ''
      const result = await requestOtp(name)
      setOtpSent(true)
      if (result?.debug_otp) setOtp(result.debug_otp)
    } catch (err) {
      setError(errorMessage(err, 'Could not send OTP.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await verifyOtp(identifier, otp)
      navigate('/')
    } catch (err) {
      setError(errorMessage(err, 'Invalid OTP.'))
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
    setOtp('')
    setOtpSent(false)
  }

  useEffect(() => {
    let active = true
    api.get('/auth/google/config')
      .then((res) => {
        if (active && res.data?.enabled && res.data?.client_id) {
          setGoogleClientId(res.data.client_id)
        }
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!googleClientId) return
    const render = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setError('')
          try {
            await googleLogin(response.credential)
            navigate('/')
          } catch (err) {
            setError(errorMessage(err, 'Google sign-in failed.'))
          }
        },
      })
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'rectangular',
      })
    }
    if (window.google?.accounts?.id) {
      render()
      return
    }
    const existing = document.getElementById('gsi-client')
    if (existing) {
      existing.addEventListener('load', render)
      return
    }
    const script = document.createElement('script')
    script.id = 'gsi-client'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = render
    document.body.appendChild(script)
  }, [googleClientId])

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: '#f5f5f5', py: 4 }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          PharmaMS Login
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
          Pharmacy Management System
        </Typography>

        <Tabs
          value={mode}
          onChange={(_, next) => switchMode(next)}
          variant="fullWidth"
          sx={{ mt: 2 }}
        >
          <Tab label="Password" value="password" />
          <Tab label="OTP" value="otp" />
        </Tabs>

        {mode === 'password' && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username or E-mail"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{ mt: 3, mb: 1 }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        )}

        {mode === 'otp' && (
          <Box component="form" onSubmit={otpSent ? handleVerify : handleRequestOtp} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username or E-mail"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={otpSent}
              autoFocus
            />
            {otpSent && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputProps={{ maxLength: 6 }}
              />
            )}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {otpSent && (
              <Alert severity="info" sx={{ mt: 2 }}>
                OTP sent to your registered e-mail. Please check your inbox (and spam folder).
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{ mt: 3, mb: 1 }}
            >
              {submitting ? <CircularProgress size={24} /> : otpSent ? 'Verify & Sign In' : 'Send OTP'}
            </Button>
            {otpSent && (
              <Button fullWidth onClick={() => setOtpSent(false)}>
                Change account / resend
              </Button>
            )}
          </Box>
        )}

        {googleClientId && (
          <>
            <Divider sx={{ my: 2 }}>or</Divider>
            <Box ref={googleBtnRef} sx={{ display: 'flex', justifyContent: 'center' }} />
          </>
        )}

        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/register')}
          >
            New user? Sign Up
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login
