import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import api, { errorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'

const Medicines = () => {
  const { user } = useAuth()
  const isManager = user?.role_name === 'Manager'
  const [medicines, setMedicines] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    medicine_code: '',
    name: '',
    generic_name: '',
    manufacturer: '',
    dosage_form: '',
    strength: '',
    unit_price: '',
    purchase_price: '',
    quantity_in_stock: 0,
    minimum_stock_level: 10,
    maximum_stock_level: 1000,
    batch_number: '',
    manufacture_date: null,
    expiry_date: null,
    storage_location: '',
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines/')
      setMedicines(response.data)
    } catch (error) {
      showSnackbar(errorMessage(error, 'Error fetching medicines'), 'error')
    }
  }

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

const handleOpen = () => {
    setEditing(false)
    setEditingId(null)
    setFormData({
      medicine_code: '',
      name: '',
      generic_name: '',
      manufacturer: '',
      dosage_form: '',
      strength: '',
      unit_price: '',
      purchase_price: '',
      quantity_in_stock: 0,
      minimum_stock_level: 10,
      maximum_stock_level: 1000,
      batch_number: '',
      manufacture_date: null,
      expiry_date: null,
      storage_location: '',
    })
    setOpen(true)
  }

const handleEdit = (medicine) => {
    setEditing(true)
    setEditingId(medicine.id)
    setFormData({
      ...medicine,
      manufacture_date: medicine.manufacture_date ? dayjs(medicine.manufacture_date) : null,
      expiry_date: medicine.expiry_date ? dayjs(medicine.expiry_date) : null,
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleDateChange = (name, value) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        manufacture_date: formData.manufacture_date ? formData.manufacture_date.format('YYYY-MM-DD') : null,
        expiry_date: formData.expiry_date ? formData.expiry_date.format('YYYY-MM-DD') : null,
        unit_price: parseFloat(formData.unit_price),
        purchase_price: parseFloat(formData.purchase_price),
        quantity_in_stock: parseInt(formData.quantity_in_stock),
        minimum_stock_level: parseInt(formData.minimum_stock_level),
        maximum_stock_level: parseInt(formData.maximum_stock_level),
      }
if (editing) {
        await api.put(`/medicines/${editingId}`, payload)
        showSnackbar('Medicine updated successfully', 'success')
      } else {
        await api.post('/medicines/', payload)
        showSnackbar('Medicine added successfully', 'success')
      }
      handleClose()
      fetchMedicines()
    } catch (error) {
      showSnackbar(errorMessage(error, 'Error saving medicine'), 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.delete(`/medicines/${id}`)
        showSnackbar('Medicine deleted successfully', 'success')
        fetchMedicines()
      } catch (error) {
        showSnackbar(errorMessage(error, 'Error deleting medicine'), 'error')
      }
    }
  }

  const baseColumns = [
    { field: 'medicine_code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Medicine Name', width: 200 },
    { field: 'generic_name', headerName: 'Generic Name', width: 150 },
    { field: 'manufacturer', headerName: 'Manufacturer', width: 150 },
    { field: 'unit_price', headerName: 'Price (₹)', width: 100 },
    { field: 'quantity_in_stock', headerName: 'Stock', width: 80 },
    { field: 'expiry_date', headerName: 'Expiry Date', width: 120 },
  ]

  const actionsColumn = {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    renderCell: (params) => (
      <Box>
        <IconButton onClick={() => handleEdit(params.row)} size="small">
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => handleDelete(params.row.id)} size="small" color="error">
          <DeleteIcon />
        </IconButton>
      </Box>
    ),
  }

  const columns = isManager ? [...baseColumns, actionsColumn] : baseColumns

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Medicine Management</Typography>
        {isManager && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add Medicine
          </Button>
        )}
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={medicines}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="medicine_code"
                  label="Medicine Code"
                  fullWidth
                  value={formData.medicine_code}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Medicine Name"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="generic_name"
                  label="Generic Name"
                  fullWidth
                  value={formData.generic_name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="manufacturer"
                  label="Manufacturer"
                  fullWidth
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="dosage_form"
                  label="Dosage Form"
                  fullWidth
                  value={formData.dosage_form}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="strength"
                  label="Strength"
                  fullWidth
                  value={formData.strength}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="unit_price"
                  label="Unit Price (₹)"
                  type="number"
                  fullWidth
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="purchase_price"
                  label="Purchase Price (₹)"
                  type="number"
                  fullWidth
                  value={formData.purchase_price}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="quantity_in_stock"
                  label="Quantity in Stock"
                  type="number"
                  fullWidth
                  value={formData.quantity_in_stock}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="minimum_stock_level"
                  label="Minimum Stock Level"
                  type="number"
                  fullWidth
                  value={formData.minimum_stock_level}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="batch_number"
                  label="Batch Number"
                  fullWidth
                  value={formData.batch_number}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="storage_location"
                  label="Storage Location"
                  fullWidth
                  value={formData.storage_location}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Manufacture Date"
                  value={formData.manufacture_date}
                  onChange={(value) => handleDateChange('manufacture_date', value)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Expiry Date"
                  value={formData.expiry_date}
                  onChange={(value) => handleDateChange('expiry_date', value)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Medicines
