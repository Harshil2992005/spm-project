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
  MenuItem,
  Chip,
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

const emptyForm = {
  patient_id: '',
  first_name: '',
  last_name: '',
  date_of_birth: null,
  gender: '',
  phone: '',
  email: '',
  address: '',
  insurance_number: '',
  insurance_provider: '',
  emergency_contact: '',
  medical_history: '',
}

const Patients = () => {
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    patient_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: null,
    gender: '',
    phone: '',
    email: '',
    address: '',
    insurance_number: '',
    insurance_provider: '',
    emergency_contact: '',
    medical_history: '',
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients/')
      setPatients(response.data)
    } catch (error) {
      showSnackbar(errorMessage(error, 'Error fetching patients'), 'error')
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
    setFormData(emptyForm)
    setOpen(true)
  }

const handleEdit = (patient) => {
    setEditing(true)
    setEditingId(patient.id)
    // Contact details are never shown on screen: the fields start empty and
    // a blank value means "keep what is already saved".
    setFormData({
      ...emptyForm,
      patient_id: patient.patient_id,
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      gender: patient.gender || '',
      address: patient.address || '',
      insurance_number: patient.insurance_number || '',
      insurance_provider: patient.insurance_provider || '',
      medical_history: patient.medical_history || '',
      date_of_birth: patient.date_of_birth ? dayjs(patient.date_of_birth) : null,
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
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      return showSnackbar('First and last name are required', 'warning')
    }
    if (!formData.date_of_birth || !formData.date_of_birth.isValid()) {
      return showSnackbar('Please pick a valid date of birth', 'warning')
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      return showSnackbar('Enter a valid e-mail address (it is used to send bills and prescriptions)', 'warning')
    }
    // Send only what the user typed; blanks are dropped so the API never sees "" for e-mail/etc.
    const payload = { date_of_birth: formData.date_of_birth.format('YYYY-MM-DD') }
    ;['first_name', 'last_name', 'gender', 'phone', 'email', 'address', 'insurance_number',
      'insurance_provider', 'emergency_contact', 'medical_history'].forEach((k) => {
      const v = typeof formData[k] === 'string' ? formData[k].trim() : formData[k]
      if (v) payload[k] = v
    })
    if (!editing && formData.patient_id.trim()) payload.patient_id = formData.patient_id.trim()

    setSaving(true)
    try {
      if (editing) {
        await api.put(`/patients/${editingId}`, payload)
        showSnackbar('Patient updated successfully', 'success')
      } else {
        const { data } = await api.post('/patients/', payload)
        showSnackbar(`Patient ${data.patient_id} added successfully`, 'success')
      }
      handleClose()
      fetchPatients()
    } catch (error) {
      showSnackbar(errorMessage(error, 'Error saving patient'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await api.delete(`/patients/${id}`)
        showSnackbar('Patient deleted successfully', 'success')
        fetchPatients()
      } catch (error) {
        showSnackbar(errorMessage(error, 'Error deleting patient'), 'error')
      }
    }
  }

  const columns = [
    { field: 'patient_id', headerName: 'Patient ID', width: 120 },
    { field: 'first_name', headerName: 'First Name', width: 150 },
    { field: 'last_name', headerName: 'Last Name', width: 150 },
    { field: 'date_of_birth', headerName: 'DOB', width: 120, valueFormatter: (p) => p.value || '-' },
    { field: 'gender', headerName: 'Gender', width: 100 },
    {
      field: 'contact',
      headerName: 'Contact on file',
      width: 190,
      sortable: false,
      valueGetter: (params) => `${params.row.phone ? 'phone ' : ''}${params.row.email ? 'email' : ''}`,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip size="small" label="Phone" color={params.row.phone ? 'success' : 'default'} variant={params.row.phone ? 'filled' : 'outlined'} />
          <Chip size="small" label="E-mail" color={params.row.email ? 'success' : 'default'} variant={params.row.email ? 'filled' : 'outlined'} />
        </Box>
      ),
    },
    {
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
    },
  ]

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Patient Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Patient
        </Button>
      </Box>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={patients}
          columns={columns}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="patient_id"
                  label="Patient ID"
                  fullWidth
                  value={formData.patient_id}
                  onChange={handleInputChange}
                  disabled={editing}
                  placeholder="Auto (e.g. PAT005)"
                  helperText={editing ? '' : 'Leave blank to auto-generate'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="first_name"
                  label="First Name"
                  fullWidth
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="last_name"
                  label="Last Name"
                  fullWidth
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={(value) => handleDateChange('date_of_birth', value)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="gender"
                  label="Gender"
                  select
                  fullWidth
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone Number"
                  placeholder={editing ? 'Saved - leave blank to keep' : ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="E-mail (for bills & prescriptions)"
                  type="email"
                  placeholder={editing ? 'Saved - leave blank to keep' : ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="emergency_contact"
                  label="Emergency Contact"
                  placeholder={editing ? 'Saved - leave blank to keep' : ''}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="insurance_number"
                  label="Insurance Number"
                  fullWidth
                  value={formData.insurance_number}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="insurance_provider"
                  label="Insurance Provider"
                  fullWidth
                  value={formData.insurance_provider}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="medical_history"
                  label="Medical History"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.medical_history}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
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

export default Patients
