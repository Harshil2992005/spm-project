import React, { useState, useEffect } from 'react'
import { Box, Typography, Button, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, MenuItem, Snackbar, Alert, IconButton, Tooltip, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, DeleteOutline as DeleteOutlineIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material'
import api, { errorMessage } from '../services/api'

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [medicines, setMedicines] = useState([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ patient_id:'', doctor_name:'', doctor_license:'', diagnosis:'', issue_date:'', status:'Pending', items:[] })
  const [item, setItem] = useState({ medicine_id:'', quantity_prescribed:'', dosage_instructions:'' })
  const [snack, setSnack] = useState({open:false,message:'',severity:'success'})

  // edit / delete state
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedRx, setSelectedRx] = useState(null)
  const [editForm, setEditForm] = useState({ doctor_name:'', doctor_license:'', diagnosis:'', issue_date:'', expiry_date:'', status:'Pending' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [r, p, m] = await Promise.all([api.get('/prescriptions/'), api.get('/patients/'), api.get('/medicines/')])
      setPrescriptions(r.data); setPatients(p.data); setMedicines(m.data)
    } catch (e) { show(errorMessage(e, 'Could not load prescriptions'), 'error') }
  }
  const show = (m, s) => setSnack({ open: true, message: m, severity: s })
  const handleClose = () => setOpen(false)

  const patientName = (id) => {
    const p = patients.find((x) => x.id === id)
    return p ? `${p.first_name} ${p.last_name}` : ''
  }

  const addItem = () => {
    const qty = parseInt(item.quantity_prescribed, 10)
    if (!item.medicine_id) return show('Choose a medicine first', 'warning')
    if (!qty || qty < 1) return show('Enter a quantity of at least 1', 'warning')
    setFormData({ ...formData, items: [...formData.items, { ...item, quantity_prescribed: qty }] })
    setItem({ medicine_id:'', quantity_prescribed:'', dosage_instructions:'' })
  }
  const removeItem = (idx) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) })

  const save = async () => {
    if (!formData.patient_id) return show('Select a patient', 'warning')
    if (!formData.doctor_name.trim()) return show('Doctor name is required', 'warning')
    if (formData.items.length === 0) return show('Add at least one medicine (press the Add button)', 'warning')
    setSaving(true)
    try {
      const payload = {
        patient_id: formData.patient_id,
        doctor_name: formData.doctor_name.trim(),
        status: formData.status,
        items: formData.items,
      }
      if (formData.doctor_license.trim()) payload.doctor_license = formData.doctor_license.trim()
      if (formData.diagnosis.trim()) payload.diagnosis = formData.diagnosis.trim()
      if (formData.issue_date) payload.issue_date = formData.issue_date
      const { data } = await api.post('/prescriptions/', payload)
      show(`Prescription ${data.prescription_number} created`, 'success')
      setOpen(false)
      setFormData({ patient_id:'', doctor_name:'', doctor_license:'', diagnosis:'', issue_date:'', status:'Pending', items:[] })
      fetchAll()
    } catch (e) { show(errorMessage(e, 'Error creating prescription'), 'error') }
    finally { setSaving(false) }
  }

  const openEdit = (row) => {
    setSelectedRx(row)
    setEditForm({
      doctor_name: row.doctor_name || '',
      doctor_license: row.doctor_license || '',
      diagnosis: row.diagnosis || '',
      issue_date: row.issue_date || '',
      expiry_date: row.expiry_date || '',
      status: row.status || 'Pending',
    })
    setEditOpen(true)
  }

  const handleEditSave = async () => {
    setSavingEdit(true)
    try {
      await api.put(`/prescriptions/${selectedRx.id}`, {
        doctor_name: editForm.doctor_name,
        doctor_license: editForm.doctor_license,
        diagnosis: editForm.diagnosis,
        issue_date: editForm.issue_date || null,
        expiry_date: editForm.expiry_date || null,
        status: editForm.status,
      })
      setEditOpen(false)
      fetchAll()
      show('Prescription updated successfully', 'success')
    } catch (e) {
      show(errorMessage(e, 'Update failed'), 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/prescriptions/${selectedRx.id}`)
      setDeleteOpen(false)
      fetchAll()
      show(`${selectedRx.prescription_number} deleted`, 'success')
    } catch (e) {
      show(errorMessage(e, 'Delete failed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const cols = [
    { field:'prescription_number', headerName:'RX#', width:170 },
    { field:'patient_id', headerName:'Patient', width:170, valueGetter: (params) => patientName(params.value) },
    { field:'doctor_name', headerName:'Doctor', width:150 },
    { field:'diagnosis', headerName:'Diagnosis', width:200 },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (params) => (
        <Alert severity={params.value === 'Filled' ? 'success' : params.value === 'Cancelled' ? 'error' : 'warning'} icon={false} sx={{ py: 0, px: 1, fontSize: 12, borderRadius: 2 }}>
          {params.value}
        </Alert>
      ),
    },
    { field:'issue_date', headerName:'Issue Date', width:130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 210,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Edit Prescription" arrow>
            <Button
              size="small"
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => openEdit(params.row)}
              sx={{
                borderRadius:'10px', textTransform:'none', fontWeight:700, fontSize:'0.75rem',
                background:'linear-gradient(145deg, #1565C0, #0D47A1)',
                boxShadow:'0 4px 0 #0a2d6e, 0 6px 8px rgba(0,0,0,0.2)',
                transition:'all 0.12s ease',
                '&:hover': { background:'linear-gradient(145deg, #1976D2, #1565C0)', boxShadow:'0 3px 0 #0a2d6e, 0 5px 6px rgba(0,0,0,0.18)', transform: 'translateY(1px)' },
                '&:active': { boxShadow: '0 1px 0 #0a2d6e', transform: 'translateY(4px)' },
              }}
            >
              Edit
            </Button>
          </Tooltip>
          <Tooltip title="Delete Prescription" arrow>
            <Button
              size="small"
              variant="contained"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => { setSelectedRx(params.row); setDeleteOpen(true) }}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                background: 'linear-gradient(145deg, #C62828, #B71C1C)',
                boxShadow: '0 4px 0 #7f0000, 0 6px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.12s ease',
                '&:hover': {
                  background: 'linear-gradient(145deg, #D32F2F, #C62828)',
                  boxShadow: '0 3px 0 #7f0000, 0 5px 6px rgba(0,0,0,0.18)',
                  transform: 'translateY(1px)',
                },
                '&:active': { boxShadow: '0 1px 0 #7f0000', transform: 'translateY(4px)' },
              }}
            >
              Delete
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box display='flex' justifyContent='space-between' mb={2}>
        <Typography variant='h4'>Prescriptions</Typography>
        <Button variant='contained' startIcon={<AddIcon/>} onClick={() => setOpen(true)}>New Prescription</Button>
      </Box>
      <Paper sx={{ height: 500 }}>
        <DataGrid rows={prescriptions} columns={cols} getRowId={r => r.id} pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </Paper>

      {/* NEW PRESCRIPTION */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>New Prescription</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Patient" value={formData.patient_id} onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}>
                {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.patient_id} - {p.first_name} {p.last_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Filled">Filled</MenuItem>
                <MenuItem value="Partially Filled">Partially Filled</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Doctor Name" value={formData.doctor_name} onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Doctor License" value={formData.doctor_license} onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Issue Date" InputLabelProps={{ shrink: true }} value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Diagnosis" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} />
            </Grid>
            <Grid item xs={12}><Typography variant="h6">Add Medicine</Typography></Grid>
            <Grid item xs={12} sm={5}>
              <TextField select fullWidth label="Medicine" value={item.medicine_id} onChange={(e) => setItem({ ...item, medicine_id: e.target.value })}>
                {medicines.map((m) => <MenuItem key={m.id} value={m.id}>{m.medicine_code} - {m.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField type="number" fullWidth label="Qty" value={item.quantity_prescribed} onChange={(e) => setItem({ ...item, quantity_prescribed: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Dosage" value={item.dosage_instructions} onChange={(e) => setItem({ ...item, dosage_instructions: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button variant="outlined" fullWidth onClick={addItem} sx={{ height: '56px' }}>Add</Button>
            </Grid>
            {formData.items.length > 0 && (
              <Grid item xs={12}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Medicine</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell>Dosage</TableCell>
                        <TableCell align="right">Remove</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>{medicines.find((x) => x.id === it.medicine_id)?.name}</TableCell>
                          <TableCell align="right">{it.quantity_prescribed}</TableCell>
                          <TableCell>{it.dosage_instructions}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => removeItem(i)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !formData.patient_id || !formData.doctor_name}>{saving ? 'Saving...' : 'Create Prescription'}</Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          Edit Prescription - {selectedRx?.prescription_number}
          <IconButton onClick={() => setEditOpen(false)} sx={{ ml: 'auto', color: '#90CAF9' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Doctor Name" value={editForm.doctor_name} onChange={(e) => setEditForm({ ...editForm, doctor_name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Doctor License" value={editForm.doctor_license} onChange={(e) => setEditForm({ ...editForm, doctor_license: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Diagnosis" value={editForm.diagnosis} onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Issue Date" InputLabelProps={{ shrink: true }} value={editForm.issue_date ? String(editForm.issue_date).slice(0, 10) : ''} onChange={(e) => setEditForm({ ...editForm, issue_date: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} value={editForm.expiry_date ? String(editForm.expiry_date).slice(0, 10) : ''} onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Filled">Filled</MenuItem>
                <MenuItem value="Partially Filled">Partially Filled</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="contained"
            startIcon={savingEdit ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={savingEdit}
            onClick={handleEditSave}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(145deg, #1565C0, #0D47A1)',
              boxShadow: '0 4px 0 #0a2d6e',
              '&:hover': { transform: 'translateY(2px)', boxShadow: '0 2px 0 #0a2d6e' },
              '&:active': { transform: 'translateY(4px)', boxShadow: 'none' },
            }}
          >
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outlined" onClick={() => setEditOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #C62828, #B71C1C)', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineIcon />
          Delete Prescription
          <IconButton onClick={() => setDeleteOpen(false)} sx={{ ml: 'auto', color: '#FFCDD2' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>
            Are you sure you want to delete <b>{selectedRx?.prescription_number}</b>
            {selectedRx?.doctor_name ? ` (Dr. ${selectedRx.doctor_name})` : ''}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="contained"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            disabled={deleting}
            onClick={handleDelete}
            sx={{
              borderRadius: '10px', textTransform: 'none', fontWeight: 700,
              background: 'linear-gradient(145deg, #C62828, #B71C1C)',
              boxShadow: '0 4px 0 #7f0000',
              '&:hover': { transform: 'translateY(2px)', boxShadow: '0 2px 0 #7f0000' },
              '&:active': { transform: 'translateY(4px)', boxShadow: 'none' },
            }}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)} sx={{ borderRadius: '10px', textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={()=>setSnack({...snack,open:false})}><Alert severity={snack.severity}>{snack.message}</Alert></Snackbar>
    </Box>
  )
}
export default Prescriptions
