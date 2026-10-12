import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Chip, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Tooltip,
  Snackbar, Alert, CircularProgress, Paper, TextField, Grid,
  MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SendIcon from '@mui/icons-material/Send'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import api, { errorMessage, formatDate, money } from '../services/api'
import InvoiceDialog from '../components/InvoiceDialog'

const press = (shadow) => ({
  transform: 'translateY(0px)',
  transition: 'all 0.12s ease',
  '&:hover': { boxShadow: `0 4px 0 ${shadow}, 0 6px 4px rgba(0,0,0,0.25)`, transform: 'translateY(2px)' },
  '&:active': { boxShadow: `0 1px 0 ${shadow}, 0 2px 2px rgba(0,0,0,0.2)`, transform: 'translateY(5px)' },
})

const styles = {
  button3D: {
    borderRadius: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'none',
    boxShadow: '0 6px 0 #1a5c1a, 0 8px 6px rgba(0,0,0,0.3)', ...press('#1a5c1a'),
  },
  button3DSend: {
    borderRadius: '12px', fontWeight: 700, textTransform: 'none', color: '#fff',
    background: 'linear-gradient(145deg, #ef5350, #c62828)',
    boxShadow: '0 6px 0 #7f0000, 0 8px 6px rgba(0,0,0,0.3)', ...press('#7f0000'),
    '&.Mui-disabled': { background: '#e0e0e0', color: '#9e9e9e', boxShadow: 'none' },
  },
  button3DView: {
    borderRadius: '12px', fontWeight: 700, textTransform: 'none', color: '#fff',
    background: 'linear-gradient(145deg, #66bb6a, #2e7d32)',
    boxShadow: '0 6px 0 #1b5e20, 0 8px 6px rgba(0,0,0,0.3)', ...press('#1b5e20'),
  },
}

const emptyForm = { patient_id: '', discount_amount: '', tax_amount: '', payment_method: 'Cash', notes: '', items: [] }

const Billing = () => {
  const [sales, setSales] = useState([])
  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])

  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(emptyForm)
  const [item, setItem] = useState({ medicine_id: '', quantity: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => { fetchAll() }, [])

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity })

  const fetchAll = async () => {
    try {
      const [s, p, m] = await Promise.all([api.get('/sales/'), api.get('/patients/'), api.get('/medicines/')])
      setSales(s.data)
      setPatients(p.data)
      setMedicines(m.data)
    } catch (e) {
      showSnackbar(errorMessage(e, 'Could not load billing data'), 'error')
    }
  }

  const medById = (id) => medicines.find((x) => x.id === id)

  const calcTotals = () => {
    const total = form.items.reduce((sum, i) => sum + i.subtotal, 0)
    const discount = parseFloat(form.discount_amount) || 0
    const tax = parseFloat(form.tax_amount) || 0
    return { total, discount, tax, net: total - discount + tax }
  }

  const addItem = () => {
    const med = medById(item.medicine_id)
    const qty = parseInt(item.quantity, 10)
    if (!med) return showSnackbar('Choose a medicine first', 'warning')
    if (!qty || qty < 1) return showSnackbar('Enter a quantity of at least 1', 'warning')
    const already = form.items.find((i) => i.medicine_id === med.id)
    const newQty = (already ? already.quantity : 0) + qty
    if (newQty > med.quantity_in_stock) {
      return showSnackbar(`Only ${med.quantity_in_stock} unit(s) of ${med.name} in stock`, 'warning')
    }
    const unit = parseFloat(med.unit_price)
    const items = already
      ? form.items.map((i) => (i.medicine_id === med.id ? { ...i, quantity: newQty, subtotal: newQty * unit } : i))
      : [...form.items, { medicine_id: med.id, quantity: qty, unit_price: unit, subtotal: qty * unit }]
    setForm({ ...form, items })
    setItem({ medicine_id: '', quantity: '' })
  }

  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })

  const openNew = () => {
    setForm(emptyForm)
    setItem({ medicine_id: '', quantity: '' })
    setOpen(true)
  }

  const save = async () => {
    const { total, discount, tax } = calcTotals()
    if (!form.patient_id) return showSnackbar('Select a patient', 'warning')
    if (form.items.length === 0) return showSnackbar('Add at least one medicine', 'warning')
    if (discount < 0 || tax < 0) return showSnackbar('Discount and tax cannot be negative', 'warning')
    if (discount > total) return showSnackbar('Discount cannot exceed the subtotal', 'warning')
    setSaving(true)
    try {
      const { data: bill } = await api.post('/sales/', {
        patient_id: form.patient_id,
        payment_method: form.payment_method,
        discount_amount: discount,
        tax_amount: tax,
        notes: form.notes,
        items: form.items.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity })),
      })
      showSnackbar(
        bill.has_email
          ? `Bill ${bill.bill_number} created - invoice is being e-mailed to the patient`
          : `Bill ${bill.bill_number} created (patient has no e-mail on record, so nothing was sent)`,
        bill.has_email ? 'success' : 'info',
      )
      setOpen(false)
      setForm(emptyForm)
      fetchAll()
      setSelectedBill(bill)
      setViewOpen(true)
    } catch (e) {
      showSnackbar(errorMessage(e, 'Error creating bill'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleViewBill = async (row) => {
    try {
      const res = await api.get(`/sales/${row.id}`)
      setSelectedBill(res.data)
    } catch {
      setSelectedBill(row)
    }
    setViewOpen(true)
  }

  const handleSendToCustomer = async (saleId, billNumber) => {
    setSendingId(saleId)
    try {
      const res = await api.post(`/sales/${saleId}/send-email`)
      showSnackbar(res.data.message || `Invoice ${billNumber} sent`, res.data.sent ? 'success' : 'warning')
    } catch (err) {
      showSnackbar(errorMessage(err, 'Failed to send e-mail'), 'error')
    } finally {
      setSendingId(null)
    }
  }

  const columns = [
    {
      field: 'bill_number',
      headerName: 'Bill No.',
      width: 190,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          icon={<ReceiptLongIcon />}
          sx={{ fontWeight: 700, bgcolor: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7' }}
        />
      ),
    },
    {
      field: 'patient_name',
      headerName: 'Patient',
      width: 190,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: '#bbdefb' }}>
            {params.value?.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'net_amount',
      headerName: 'Net (₹)',
      width: 120,
      renderCell: (params) => (
        <Typography fontWeight={700} color="success.dark">₹ {money(params.value)}</Typography>
      ),
    },
    {
      field: 'payment_method',
      headerName: 'Payment',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      ),
    },
    {
      field: 'payment_status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={params.value === 'Paid' ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
      ),
    },
    {
      field: 'sale_date',
      headerName: 'Date',
      width: 130,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 300,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<VisibilityIcon />}
            sx={styles.button3DView}
            onClick={() => handleViewBill(params.row)}
          >
            View
          </Button>
          <Tooltip title={params.row.has_email ? 'E-mail this invoice to the patient' : 'Patient has no e-mail on record'} arrow>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={sendingId === params.row.id ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                sx={styles.button3DSend}
                onClick={() => handleSendToCustomer(params.row.id, params.row.bill_number)}
                disabled={sendingId === params.row.id || !params.row.has_email}
              >
                {sendingId === params.row.id ? 'Sending...' : 'Send to Customer'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ]

  const { total, net } = calcTotals()
  const pickedMed = medById(item.medicine_id)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <ReceiptLongIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>Billing &amp; Sales</Typography>
          <Typography variant="body2" color="text.secondary">
            Create bills, view invoices and send them to customers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={openNew}
          size="large"
          sx={{ ml: 'auto', ...styles.button3D }}
        >
          New Bill
        </Button>
      </Box>

      <Paper sx={{ height: 520 }}>
        <DataGrid
          rows={sales}
          columns={columns}
          getRowId={(r) => r.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#f1f8e9' } }}
        />
      </Paper>

      <InvoiceDialog
        bill={selectedBill}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        sending={sendingId === selectedBill?.id}
        onSend={selectedBill?.has_email ? () => handleSendToCustomer(selectedBill.id, selectedBill.bill_number) : undefined}
      />

      {/* -------- New Bill dialog -------- */}
      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Bill</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="Patient" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.patient_id} - {p.first_name} {p.last_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Payment" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><Typography variant="h6">Items</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Medicine" value={item.medicine_id} onChange={(e) => setItem({ ...item, medicine_id: e.target.value })}>
                {medicines.map((m) => (
                  <MenuItem key={m.id} value={m.id} disabled={m.quantity_in_stock <= 0}>
                    {m.name} - ₹{m.unit_price} ({m.quantity_in_stock} in stock)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                type="number" fullWidth label="Qty" value={item.quantity}
                inputProps={{ min: 1, max: pickedMed?.quantity_in_stock }}
                onChange={(e) => setItem({ ...item, quantity: e.target.value })}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <Button variant="outlined" fullWidth onClick={addItem} sx={{ height: '56px' }}>Add</Button>
            </Grid>
            <Grid item xs={12}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Rate (₹)</TableCell>
                      <TableCell align="right">Amount (₹)</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.items.map((it, i) => (
                      <TableRow key={it.medicine_id}>
                        <TableCell>{medById(it.medicine_id)?.name}</TableCell>
                        <TableCell align="right">{it.quantity}</TableCell>
                        <TableCell align="right">{money(it.unit_price)}</TableCell>
                        <TableCell align="right">{money(it.subtotal)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => removeItem(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.items.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>No medicines added yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField type="number" fullWidth label="Discount (₹)" value={form.discount_amount} inputProps={{ min: 0 }} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField type="number" fullWidth label="Tax (₹)" value={form.tax_amount} inputProps={{ min: 0 }} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#e8f5e9', p: 1.5, borderRadius: 2 }}>
                <Typography>Subtotal: <b>₹ {money(total)}</b></Typography>
                <Typography fontWeight={800}>Net payable: ₹ {money(net)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Generating...' : 'Generate Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Billing
