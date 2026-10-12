import React, { useState } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../services/api'

const empty = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password: '',
  confirm: '',
}

const Register = () => {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register, login } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setSubmitting(true)
    try {
      await register({
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
      })
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      setError(errorMessage(err, 'Registration failed. Check the fields and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: '#f5f5f5', py: 4 }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 460 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          Create Account
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
          Pharmacy Management System
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField margin="normal" required fullWidth label="First name"
              value={form.first_name} onChange={set('first_name')} />
            <TextField margin="normal" required fullWidth label="Last name"
              value={form.last_name} onChange={set('last_name')} />
          </Box>
          <TextField margin="normal" required fullWidth label="Username"
            value={form.username} onChange={set('username')} autoComplete="username" />
          <TextField margin="normal" required fullWidth type="email" label="E-mail"
            value={form.email} onChange={set('email')} autoComplete="email" />
          <TextField margin="normal" required fullWidth label="Password" type="password"
            value={form.password} onChange={set('password')} autoComplete="new-password" />
          <TextField margin="normal" required fullWidth label="Confirm password" type="password"
            value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          <Button type="submit" fullWidth variant="contained" disabled={submitting} sx={{ mt: 3 }}>
            {submitting ? <CircularProgress size={24} /> : 'Create Account'}
          </Button>
          <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/login')}>
            Already registered? Sign In
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default Register
