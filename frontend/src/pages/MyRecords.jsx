import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import api, { errorMessage, formatDate, formatDateTime, money } from '../services/api'
import InvoiceDialog from '../components/InvoiceDialog'
import { useAuth } from '../context/AuthContext'

const MyRecords = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState(0)
  const [sales, setSales] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [error, setError] = useState('')
  const [bill, setBill] = useState(null)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const [s, r] = await Promise.all([
        api.get('/sales/'),
        api.get('/prescriptions/'),
      ])
      setSales(s.data)
      setPrescriptions(r.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load your records.'))
    }
  }

  const openBill = async (row) => {
    try {
      const res = await api.get(`/sales/${row.id}`)
      setBill(res.data)
    } catch (err) {
      setError(errorMessage(err, 'Could not open the invoice.'))
    }
  }

  const billColumns = [
    { field: 'bill_number', headerName: 'Bill #', width: 190 },
    { field: 'sale_date', headerName: 'Date & time', width: 200, valueFormatter: (p) => formatDateTime(p.value) },
    { field: 'payment_method', headerName: 'Payment', width: 120 },
    { field: 'payment_status', headerName: 'Status', width: 110 },
    { field: 'net_amount', headerName: 'Net (₹)', width: 120, valueFormatter: (p) => money(p.value) },
    {
      field: 'actions', headerName: 'Invoice', width: 130, sortable: false,
      renderCell: (params) => (
        <Button size="small" variant="contained" onClick={() => openBill(params.row)}>View</Button>
      ),
    },
  ]

  const rxColumns = [
    { field: 'prescription_number', headerName: 'RX#', width: 160 },
    { field: 'doctor_name', headerName: 'Doctor', width: 160 },
    { field: 'diagnosis', headerName: 'Diagnosis', width: 240 },
    { field: 'status', headerName: 'Status', width: 130 },
    { field: 'issue_date', headerName: 'Issue Date', width: 130, valueFormatter: (p) => formatDate(p.value) },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Records
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {user ? `Bills and prescriptions for ${user.first_name} ${user.last_name}` : ''}
      </Typography>

      <Tabs value={tab} onChange={(_, next) => setTab(next)} variant="fullWidth" sx={{ mt: 2 }}>
        <Tab label="My Bills" value={0} />
        <Tab label="My Prescriptions" value={1} />
      </Tabs>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {tab === 0 && (
        <Paper sx={{ height: 520, mt: 2 }}>
          <DataGrid
            rows={sales}
            columns={billColumns}
            getRowId={(r) => r.id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ height: 520, mt: 2 }}>
          <DataGrid
            rows={prescriptions}
            columns={rxColumns}
            getRowId={(r) => r.id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
          />
        </Paper>
      )}

      <InvoiceDialog bill={bill} open={Boolean(bill)} onClose={() => setBill(null)} />
    </Box>
  )
}

export default MyRecords
