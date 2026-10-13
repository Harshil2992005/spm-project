/**
 * In-memory mock backend used when VITE_USE_MOCK=true (or to demo without a
 * server). The method signatures match the real API layer 1:1, so switching
 * is a one-line change and the UI never knows the difference.
 */
import type {
  AuthUser,
  Medicine,
  MedicineCreate,
  MedicineUpdate,
  Patient,
  PatientCreate,
  PatientUpdate,
  Prescription,
  PrescriptionCreate,
  PrescriptionUpdate,
  Sale,
  SaleCreate,
} from './types'

const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 10)}`
const wait = <T>(v: T, ms = 260): Promise<T> => new Promise((r) => setTimeout(() => r(v), ms))

function seedMedicines(): Medicine[] {
  const base: Array<Partial<Medicine> & Pick<Medicine, 'medicine_code' | 'name'>> = [
    { medicine_code: 'MED001', name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', manufacturer: 'Cipla', strength: '500mg', unit_price: 2.5, purchase_price: 1.4, quantity_in_stock: 240, expiry_date: '2027-06-30' },
    { medicine_code: 'MED002', name: 'Amoxicillin 250mg', generic_name: 'Amoxicillin', manufacturer: 'Sun Pharma', strength: '250mg', unit_price: 6.0, purchase_price: 3.5, quantity_in_stock: 120, expiry_date: '2027-02-15' },
    { medicine_code: 'MED003', name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', manufacturer: 'Sun Pharma', strength: '500mg', unit_price: 9.5, purchase_price: 5.5, quantity_in_stock: 18, expiry_date: '2026-11-06' },
    { medicine_code: 'MED004', name: 'Azithromycin 250mg', generic_name: 'Azithromycin', manufacturer: 'Alkem', strength: '250mg', unit_price: 18.0, purchase_price: 11.0, quantity_in_stock: 64, expiry_date: '2027-09-01' },
    { medicine_code: 'MED005', name: 'Metformin 500mg', generic_name: 'Metformin HCl', manufacturer: 'USV', strength: '500mg', unit_price: 3.2, purchase_price: 1.8, quantity_in_stock: 300, expiry_date: '2028-01-20' },
    { medicine_code: 'MED006', name: 'Amlodipine 5mg', generic_name: 'Amlodipine', manufacturer: 'Pfizer', strength: '5mg', unit_price: 4.1, purchase_price: 2.2, quantity_in_stock: 12, expiry_date: '2026-12-18' },
    { medicine_code: 'MED007', name: 'Cetirizine 10mg', generic_name: 'Cetirizine', manufacturer: 'Dr. Reddy', strength: '10mg', unit_price: 2.0, purchase_price: 1.0, quantity_in_stock: 150, expiry_date: '2027-04-11' },
    { medicine_code: 'MED008', name: 'Insulin Glargine', generic_name: 'Insulin Glargine', manufacturer: 'Biocon', strength: '100IU/ml', unit_price: 420.0, purchase_price: 320.0, quantity_in_stock: 0, expiry_date: '2027-03-30' },
    { medicine_code: 'MED009', name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', manufacturer: 'Abbott', strength: '400mg', unit_price: 3.6, purchase_price: 2.0, quantity_in_stock: 88, expiry_date: '2026-11-28' },
    { medicine_code: 'MED010', name: 'Omeprazole 20mg', generic_name: 'Omeprazole', manufacturer: 'Zydus', strength: '20mg', unit_price: 5.4, purchase_price: 3.0, quantity_in_stock: 6, expiry_date: '2026-10-25' },
  ]
  return base.map((b) => ({
    id: uid('med'),
    generic_name: null,
    manufacturer: null,
    dosage_form: 'Tablet',
    strength: null,
    purchase_price: 1,
    quantity_in_stock: 0,
    minimum_stock_level: 10,
    maximum_stock_level: 500,
    batch_number: `B${Math.floor(Math.random() * 9000 + 1000)}`,
    manufacture_date: '2025-01-15',
    storage_location: 'Aisle A · Shelf 2',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...b,
  })) as Medicine[]
}

function seedPatients(): Patient[] {
  return [
    { id: uid('pat'), patient_id: 'PAT001', first_name: 'Rahul', last_name: 'Sharma', date_of_birth: '1988-04-12', gender: 'Male', phone: '+91 98765 43210', email: 'rahul.sharma@example.com', address: '12 MG Road, Ahmedabad' },
    { id: uid('pat'), patient_id: 'PAT002', first_name: 'Priya', last_name: 'Mehta', date_of_birth: '1995-11-02', gender: 'Female', phone: '+91 99887 76655', email: 'priya.mehta@example.com', address: '44 Ring Road, Surat' },
    { id: uid('pat'), patient_id: 'PAT003', first_name: 'Aarav', last_name: 'Patel', date_of_birth: '2010-07-21', gender: 'Male', phone: '+91 90000 11122', email: 'aarav.patel@example.com', address: '7 Law Garden, Ahmedabad' },
  ].map((p) => ({ insurance_number: null, insurance_provider: null, emergency_contact: null, medical_history: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...p })) as Patient[]
}

function seedPrescriptions(pat: Patient[], med: Medicine[]): Prescription[] {
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      id: uid('rx'),
      prescription_number: 'RX-100001',
      patient_id: pat[0].id,
      doctor_name: 'Dr. Nisha Verma',
      doctor_license: 'GJ-MED-48213',
      diagnosis: 'Acute bacterial sinusitis',
      issue_date: today,
      expiry_date: null,
      status: 'Pending',
      prescribed_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        { id: uid('rxi'), medicine_id: med[1].id, medicine_name: med[1].name, quantity_prescribed: 10, quantity_dispensed: 0, dosage_instructions: '1 tablet twice daily after food' },
      ],
    },
    {
      id: uid('rx'),
      prescription_number: 'RX-100002',
      patient_id: pat[1].id,
      doctor_name: 'Dr. Kunal Shah',
      doctor_license: 'GJ-MED-33901',
      diagnosis: 'Type 2 diabetes — maintenance',
      issue_date: today,
      expiry_date: null,
      status: 'Filled',
      prescribed_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        { id: uid('rxi'), medicine_id: med[4].id, medicine_name: med[4].name, quantity_prescribed: 30, quantity_dispensed: 30, dosage_instructions: '1 tablet at night' },
      ],
    },
  ]
}

let medicines = seedMedicines()
let patients = seedPatients()
let prescriptions = seedPrescriptions(patients, medicines)
let sales: Sale[] = [
  {
    id: uid('sale'),
    bill_number: 'BILL-20261005-0001',
    patient_id: patients[0].id,
    cashier_id: 'user-1',
    patient_name: 'Rahul Sharma',
    patient_email: 'rahul.sharma@example.com',
    total_amount: 190,
    discount_amount: 10,
    tax_amount: 32.4,
    net_amount: 212.4,
    payment_method: 'UPI',
    payment_status: 'Paid',
    sale_date: '2026-10-05T10:24:00Z',
    items: [
      { medicine_id: medicines[3].id, medicine_name: medicines[3].name, quantity: 10, unit_price: 18, subtotal: 180 },
    ],
  },
]

const currentUser: AuthUser = {
  id: 'user-1',
  username: 'harshil patel',
  email: 'harshilpatel2992005@gmail.com',
  first_name: 'Harshil',
  last_name: 'Patel',
  role_id: 1,
  role_name: 'Manager',
}

export const mockApi = {
  getMe: () => wait(currentUser),

  getMedicines: (params?: { skip?: number; limit?: number }) => {
    const skip = params?.skip ?? 0
    const limit = params?.limit ?? 100
    return wait(medicines.slice(skip, skip + limit))
  },
  getMedicine: (id: string) => {
    const m = medicines.find((x) => x.id === id)
    return m ? wait(m) : Promise.reject(new Error('Medicine not found'))
  },
  createMedicine: (payload: MedicineCreate) => {
    if (medicines.some((m) => m.medicine_code.toLowerCase() === payload.medicine_code.toLowerCase())) {
      return Promise.reject(Object.assign(new Error('Medicine code already exists'), { status: 409 }))
    }
    const created: Medicine = {
      ...payload,
      id: uid('med'),
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    medicines = [created, ...medicines]
    return wait(created)
  },
  updateMedicine: (id: string, payload: MedicineUpdate) => {
    const idx = medicines.findIndex((m) => m.id === id)
    if (idx === -1) return Promise.reject(Object.assign(new Error('Not found'), { status: 404 }))
    medicines[idx] = { ...medicines[idx], ...payload, updated_at: new Date().toISOString() }
    return wait(medicines[idx])
  },
  deleteMedicine: (id: string) => {
    medicines = medicines.filter((m) => m.id !== id)
    return wait({ message: 'Medicine deleted successfully' })
  },

  getPatients: () => wait(patients),
  getPatient: (id: string) => {
    const p = patients.find((x) => x.id === id)
    return p ? wait(p) : Promise.reject(new Error('Patient not found'))
  },
  createPatient: (payload: PatientCreate) => {
    const created: Patient = { ...payload, id: uid('pat'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    patients = [created, ...patients]
    return wait(created)
  },
  updatePatient: (id: string, payload: PatientUpdate) => {
    const idx = patients.findIndex((p) => p.id === id)
    if (idx === -1) return Promise.reject(Object.assign(new Error('Not found'), { status: 404 }))
    patients[idx] = { ...patients[idx], ...payload, updated_at: new Date().toISOString() }
    return wait(patients[idx])
  },
  deletePatient: (id: string) => {
    patients = patients.filter((p) => p.id !== id)
    return wait({ message: 'Patient deleted successfully' })
  },

  /* -------------------------------------------------------- prescriptions */
  getPrescriptions: () => wait(prescriptions),
  createPrescription: (payload: PrescriptionCreate) => {
    const created: Prescription = {
      ...payload,
      id: uid('rx'),
      status: payload.status ?? 'Pending',
      prescription_number: payload.prescription_number ?? `RX-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: payload.items.map((it) => ({
        ...it,
        id: uid('rxi'),
        medicine_name: medicines.find((m) => m.id === it.medicine_id)?.name ?? 'Item',
      })),
    }
    prescriptions = [created, ...prescriptions]
    return wait(created, 380)
  },
  updatePrescription: (id: string, payload: PrescriptionUpdate) => {
    const idx = prescriptions.findIndex((p) => p.id === id)
    if (idx === -1) return Promise.reject(Object.assign(new Error('Not found'), { status: 404 }))
    const merged: Prescription = { ...prescriptions[idx], ...payload, updated_at: new Date().toISOString() }
    if (payload.items) {
      merged.items = payload.items.map((it) => ({
        ...it,
        id: uid('rxi'),
        medicine_name: medicines.find((m) => m.id === it.medicine_id)?.name ?? 'Item',
      }))
    }
    prescriptions[idx] = merged
    return wait(merged)
  },
  deletePrescription: (id: string) => {
    prescriptions = prescriptions.filter((p) => p.id !== id)
    return wait({ message: 'Prescription deleted successfully' })
  },

  getBills: () => wait(sales),
  getBill: (id: string) => {
    const s = sales.find((x) => x.id === id)
    return s ? wait(s) : Promise.reject(new Error('Bill not found'))
  },
  createBill: (payload: SaleCreate) => {
    const patient = patients.find((p) => p.id === payload.patient_id)
    const sale: Sale = {
      ...payload,
      id: uid('sale'),
      bill_number: `BILL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(sales.length + 1).padStart(4, '0')}`,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Walk-in',
      patient_email: patient?.email ?? null,
      payment_status: payload.payment_status ?? 'Paid',
      sale_date: new Date().toISOString(),
      items: payload.items.map((it) => ({
        ...it,
        id: uid('item'),
        medicine_name: medicines.find((m) => m.id === it.medicine_id)?.name ?? 'Item',
      })),
    }
    // Decrement stock like the real backend does.
    for (const it of payload.items) {
      const m = medicines.find((x) => x.id === it.medicine_id)
      if (m) m.quantity_in_stock = Math.max(0, m.quantity_in_stock - it.quantity)
    }
    sales = [sale, ...sales]
    return wait(sale, 420)
  },
  sendBillEmail: (id: string) => {
    const sale = sales.find((s) => s.id === id)
    if (!sale?.patient_email) {
      return Promise.reject(Object.assign(new Error('Patient has no e-mail'), { status: 400 }))
    }
    return wait({ sent: true, email: sale.patient_email, message: 'Bill e-mailed (demo).' })
  },
}
