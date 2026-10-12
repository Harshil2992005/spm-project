import React from 'react'
import {
  Box, Typography, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Table, TableBody, TableCell, TableHead, TableRow, Divider,
} from '@mui/material'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import SendIcon from '@mui/icons-material/Send'
import { formatDateTime, money } from '../services/api'

const headCell = { bgcolor: '#1b5e20', color: '#fff', fontWeight: 700, border: '1px solid #1b5e20' }
const cell = { border: '1px solid #e0e0e0' }

/** Printable invoice: header, bill details, item table, totals. */
const InvoiceDialog = ({ bill, open, onClose, onSend, sending }) => {
  if (!bill) return null
  const paid = bill.payment_status === 'Paid'
  const items = bill.items || []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth className="invoice-dialog">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <DialogTitle className="no-print" sx={{ bgcolor: '#1B5E20', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptLongIcon /> Invoice - {bill.bill_number}
        <IconButton onClick={onClose} sx={{ ml: 'auto', color: '#fff' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box id="invoice-print" sx={{ p: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="primary">PharmaMS</Typography>
              <Typography variant="body2" color="text.secondary">Pharmacy Management System</Typography>
            </Box>
            <Box textAlign={{ xs: 'left', sm: 'right' }}>
              <Typography variant="h6" fontWeight={800}>PAYMENT RECEIPT</Typography>
              <Chip
                label={(bill.payment_status || '').toUpperCase()}
                color={paid ? 'success' : 'warning'}
                size="small"
                sx={{ fontWeight: 700, mt: 0.5 }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Bill No.</Typography>
              <Typography fontWeight={700}>{bill.bill_number}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Date &amp; Time</Typography>
              <Typography fontWeight={700}>{formatDateTime(bill.sale_date)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Patient</Typography>
              <Typography fontWeight={700}>{bill.patient_name || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Payment</Typography>
              <Typography fontWeight={700}>{bill.payment_method} ({bill.payment_status})</Typography>
            </Box>
          </Box>

          <Table size="small" sx={{ borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ ...headCell, width: 50 }}>#</TableCell>
                <TableCell sx={headCell}>Medicine</TableCell>
                <TableCell align="center" sx={headCell}>Qty</TableCell>
                <TableCell align="right" sx={headCell}>Rate (₹)</TableCell>
                <TableCell align="right" sx={headCell}>Amount (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={it.id || i} sx={{ bgcolor: i % 2 ? '#f7faf8' : '#fff' }}>
                  <TableCell align="center" sx={cell}>{i + 1}</TableCell>
                  <TableCell sx={cell}>{it.medicine_name}</TableCell>
                  <TableCell align="center" sx={cell}>{it.quantity}</TableCell>
                  <TableCell align="right" sx={cell}>{money(it.unit_price)}</TableCell>
                  <TableCell align="right" sx={cell}>{money(it.subtotal)}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={cell}>No line items.</TableCell></TableRow>
              )}
              <TableRow>
                <TableCell colSpan={4} align="right" sx={cell}>Subtotal</TableCell>
                <TableCell align="right" sx={cell}>₹ {money(bill.total_amount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} align="right" sx={cell}>Discount</TableCell>
                <TableCell align="right" sx={cell}>- ₹ {money(bill.discount_amount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} align="right" sx={cell}>Tax</TableCell>
                <TableCell align="right" sx={cell}>+ ₹ {money(bill.tax_amount)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                <TableCell colSpan={4} align="right" sx={{ ...cell, fontWeight: 800, fontSize: 16 }}>
                  {paid ? 'NET PAID' : 'NET PAYABLE'}
                </TableCell>
                <TableCell align="right" sx={{ ...cell, fontWeight: 800, fontSize: 16 }}>₹ {money(bill.net_amount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {bill.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Note: {bill.notes}</Typography>
          )}
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 4 }}>
            Thank you for choosing PharmaMS. Get well soon!
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions className="no-print" sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>Print</Button>
        {onSend && (
          <Button variant="contained" color="primary" startIcon={<SendIcon />} disabled={sending} onClick={onSend}>
            {sending ? 'Sending...' : 'E-mail to patient'}
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default InvoiceDialog
