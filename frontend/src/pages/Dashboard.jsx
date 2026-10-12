import React, { useState, useEffect } from 'react'
import {
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
} from '@mui/material'
import MedicationIcon from '@mui/icons-material/Medication'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const isManager = user?.role_name === 'Manager'
  const [medicines, setMedicines] = useState([])
  const [patients, setPatients] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [expiringSoon, setExpiringSoon] = useState([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [medicinesRes, lowStockRes, expiringRes] = await Promise.all([
        api.get('/medicines/'),
        api.get('/medicines/low-stock/'),
        api.get('/medicines/expiring-soon/'),
      ])
      setMedicines(medicinesRes.data)
      setLowStock(lowStockRes.data)
      setExpiringSoon(expiringRes.data)
      if (isManager) {
        const patientsRes = await api.get('/patients/')
        setPatients(patientsRes.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Medicines',
      value: medicines.length,
      icon: <MedicationIcon sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
      shadow: 'rgba(27,94,32,0.4)',
      subtitle: `${medicines.filter((m) => m.is_active !== false).length} active`,
    },
    ...(isManager
      ? [{
          title: 'Total Patients',
          value: patients.length,
          icon: <PeopleAltIcon sx={{ fontSize: 32 }} />,
          gradient: 'linear-gradient(135deg, #0277BD 0%, #0288d1 100%)',
          shadow: 'rgba(2,119,189,0.4)',
          subtitle: 'registered patients',
        }]
      : []),
    {
      title: 'Low Stock Alerts',
      value: lowStock.length,
      icon: <WarningAmberIcon sx={{ fontSize: 32 }} />,
      gradient: lowStock.length > 0
        ? 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)'
        : 'linear-gradient(135deg, #388E3C 0%, #43A047 100%)',
      shadow: lowStock.length > 0 ? 'rgba(230,81,0,0.4)' : 'rgba(56,142,60,0.3)',
      subtitle: lowStock.length > 0 ? 'need restocking' : 'all stocked',
    },
    {
      title: 'Expiring Soon',
      value: expiringSoon.length,
      icon: <EventBusyIcon sx={{ fontSize: 32 }} />,
      gradient: expiringSoon.length > 0
        ? 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 100%)'
        : 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
      shadow: expiringSoon.length > 0 ? 'rgba(183,28,28,0.4)' : 'rgba(27,94,32,0.3)',
      subtitle: 'expire within 30 days',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Pharmacy Management System - Overview
      </Typography>

      <Grid container spacing={2.5} sx={{ mt: 2, mb: 3 }}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                background: card.gradient,
                boxShadow: `0 8px 32px ${card.shadow}, 0 2px 8px rgba(0,0,0,0.1)`,
                color: '#fff',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 16px 40px ${card.shadow}, 0 4px 12px rgba(0,0,0,0.15)`,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.75)',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h2"
                    sx={{ fontWeight: 900, lineHeight: 1.1, my: 0.5, fontSize: { xs: '2.5rem', md: '3rem' } }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>
                    {card.subtitle}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    borderRadius: 3,
                    p: 1.2,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {lowStock.length > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          {lowStock.length} medicine(s) are running low on stock!
        </Alert>
      )}

      {expiringSoon.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {expiringSoon.length} medicine(s) will expire within 30 days!
        </Alert>
      )}

      {/* Bottom Section: two panels */}
      <Grid container spacing={2.5} sx={{ mt: 1 }}>

        {/* LEFT: Low Stock Medicines */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 4, border: '1px solid #FFE0B2', overflow: 'hidden', boxShadow: '0 4px 20px rgba(230,81,0,0.08)' }}
          >
            <Box
              sx={{
                px: 2.5, py: 1.8,
                background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
                display: 'flex', alignItems: 'center', gap: 1,
                borderBottom: '1px solid #FFE0B2',
              }}
            >
              <WarningAmberIcon sx={{ color: '#E65100', fontSize: 22 }} />
              <Typography fontWeight={800} color="#E65100" fontSize="0.95rem">
                Low Stock Medicines
              </Typography>
              <Chip label={lowStock.length} size="small" sx={{ ml: 'auto', bgcolor: '#E65100', color: '#fff', fontWeight: 800, fontSize: 11 }} />
            </Box>

            {lowStock.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ color: '#2E7D32', fontSize: 40, mb: 1 }} />
                <Typography color="success.main" fontWeight={700}>All medicines well stocked!</Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {lowStock.slice(0, 6).map((med, i) => (
                  <Box
                    key={med.id}
                    sx={{
                      px: 2.5, py: 1.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: i < lowStock.length - 1 ? '1px solid #FFF3E0' : 'none',
                      '&:hover': { bgcolor: '#FFFDE7' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: med.quantity_in_stock === 0 ? '#D32F2F' : '#E65100', flexShrink: 0 }} />
                      <Box>
                        <Typography fontSize="0.85rem" fontWeight={700} lineHeight={1.2}>{med.name}</Typography>
                        <Typography fontSize="0.72rem" color="text.secondary">{med.medicine_code}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={`${med.quantity_in_stock} left`}
                        size="small"
                        sx={{
                          bgcolor: med.quantity_in_stock === 0 ? '#FFEBEE' : '#FFF3E0',
                          color: med.quantity_in_stock === 0 ? '#C62828' : '#E65100',
                          fontWeight: 800, fontSize: 11,
                          border: `1px solid ${med.quantity_in_stock === 0 ? '#EF9A9A' : '#FFCC80'}`,
                        }}
                      />
                      <Typography fontSize="0.7rem" color="text.secondary" mt={0.3}>min: {med.minimum_stock_level}</Typography>
                    </Box>
                  </Box>
                ))}
                {lowStock.length > 6 && (
                  <Box sx={{ px: 2.5, py: 1, bgcolor: '#FFF8E1' }}>
                    <Typography fontSize="0.78rem" color="#E65100" fontWeight={600}>
                      +{lowStock.length - 6} more medicines need restocking
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: Expiring Soon Medicines */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{ borderRadius: 4, border: '1px solid #FFCDD2', overflow: 'hidden', boxShadow: '0 4px 20px rgba(183,28,28,0.08)' }}
          >
            <Box
              sx={{
                px: 2.5, py: 1.8,
                background: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
                display: 'flex', alignItems: 'center', gap: 1,
                borderBottom: '1px solid #FFCDD2',
              }}
            >
              <EventBusyIcon sx={{ color: '#B71C1C', fontSize: 22 }} />
              <Typography fontWeight={800} color="#B71C1C" fontSize="0.95rem">
                Expiring Soon
              </Typography>
              <Chip label={expiringSoon.length} size="small" sx={{ ml: 'auto', bgcolor: '#B71C1C', color: '#fff', fontWeight: 800, fontSize: 11 }} />
            </Box>

            {expiringSoon.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ color: '#2E7D32', fontSize: 40, mb: 1 }} />
                <Typography color="success.main" fontWeight={700}>No medicines expiring soon!</Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                {expiringSoon.slice(0, 6).map((med, i) => {
                  const daysLeft = Math.ceil((new Date(med.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
                  return (
                    <Box
                      key={med.id}
                      sx={{
                        px: 2.5, py: 1.4,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: i < expiringSoon.length - 1 ? '1px solid #FFEBEE' : 'none',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: '#FFF8F8' },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: daysLeft <= 7 ? '#B71C1C' : '#E53935', flexShrink: 0 }} />
                        <Box>
                          <Typography fontSize="0.85rem" fontWeight={700} lineHeight={1.2}>{med.name}</Typography>
                          <Typography fontSize="0.72rem" color="text.secondary">
                            Exp: {new Date(med.expiry_date).toLocaleDateString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                        size="small"
                        sx={{
                          bgcolor: daysLeft <= 0 ? '#B71C1C' : daysLeft <= 7 ? '#FFEBEE' : '#FFF3E0',
                          color: daysLeft <= 0 ? '#fff' : daysLeft <= 7 ? '#B71C1C' : '#E65100',
                          fontWeight: 800, fontSize: 11,
                          border: daysLeft <= 0 ? 'none' : `1px solid ${daysLeft <= 7 ? '#EF9A9A' : '#FFCC80'}`,
                        }}
                      />
                    </Box>
                  )
                })}
                {expiringSoon.length > 6 && (
                  <Box sx={{ px: 2.5, py: 1, bgcolor: '#FFF8F8' }}>
                    <Typography fontSize="0.78rem" color="#B71C1C" fontWeight={600}>
                      +{expiringSoon.length - 6} more medicines expiring soon
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

      </Grid>
    </Box>
  )
}

export default Dashboard
