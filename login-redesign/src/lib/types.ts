/**
 * Domain types — these mirror the existing FastAPI/Pydantic schemas exactly
 * (see backend/app/schemas/*.py). Field names must not drift, or the real
 * backend will silently drop values.
 */

export interface Medicine {
  id: string
  medicine_code: string
  name: string
  generic_name?: string | null
  manufacturer?: string | null
  dosage_form?: string | null
  strength?: string | null
  unit_price: number
  purchase_price: number
  quantity_in_stock: number
  minimum_stock_level: number
  maximum_stock_level?: number | null
  batch_number?: string | null
  manufacture_date?: string | null
  expiry_date: string
  storage_location?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/** Create payload = everything except server-managed fields. */
export type MedicineCreate = Omit<Medicine, 'id' | 'created_at' | 'updated_at'>

/** Update payload = all optional, and the backend does NOT accept medicine_code. */
export type MedicineUpdate = Partial<Omit<MedicineCreate, 'medicine_code'>>

export interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  insurance_number?: string | null
  insurance_provider?: string | null
  emergency_contact?: string | null
  medical_history?: string | null
  created_at?: string
  updated_at?: string
}

export type PatientCreate = Omit<Patient, 'id' | 'created_at' | 'updated_at'>

/** Update payload = all optional, and the backend does NOT accept patient_id. */
export type PatientUpdate = Partial<Omit<PatientCreate, 'patient_id'>>

/* ------------------------------------------------------------ prescriptions */

export interface PrescriptionItem {
  id?: string
  prescription_id?: string
  medicine_id: string
  quantity_prescribed: number
  quantity_dispensed?: number
  dosage_instructions?: string | null
  medicine_name?: string
}

export interface PrescriptionItemCreate {
  medicine_id: string
  quantity_prescribed: number
  quantity_dispensed?: number
  dosage_instructions?: string | null
}

export interface Prescription {
  id: string
  prescription_number?: string | null
  patient_id: string
  doctor_name: string
  doctor_license?: string | null
  diagnosis?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  status: string
  prescribed_by?: string | null
  created_at?: string
  updated_at?: string
  items?: PrescriptionItem[]
}

export interface PrescriptionCreate {
  patient_id: string
  doctor_name: string
  doctor_license?: string | null
  diagnosis?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  status?: string
  prescription_number?: string | null
  items: PrescriptionItemCreate[]
}

/** Update payload = all optional; patient_id is immutable. */
export interface PrescriptionUpdate {
  doctor_name?: string
  doctor_license?: string | null
  diagnosis?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  status?: string
  items?: PrescriptionItemCreate[]
}

export interface SaleItem {
  id?: string
  sale_id?: string
  medicine_id: string
  quantity: number
  unit_price: number
  subtotal: number
  medicine_name?: string
}

export interface SaleCreateItem {
  medicine_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface SaleCreate {
  patient_id: string
  cashier_id: string
  items: SaleCreateItem[]
  total_amount: number
  discount_amount: number
  tax_amount: number
  net_amount: number
  payment_method: string
  payment_status?: string
  notes?: string | null
}

export interface Sale {
  id: string
  bill_number: string
  patient_id: string
  cashier_id: string
  patient_name?: string
  has_email?: boolean
  /** Mock data only - the real API no longer returns e-mail addresses. */
  patient_email?: string | null
  total_amount: number
  discount_amount: number
  tax_amount: number
  net_amount: number
  payment_method: string
  payment_status: string
  notes?: string | null
  sale_date: string
  items?: SaleItem[]
}

export interface AuthUser {
  id: string
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role_id: number
  role_name?: string | null
}

/* --------------------------------------------------------------- orders */

export interface OrderItem {
  id?: string
  order_id?: string
  medicine_id: string
  medicine_name?: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface OrderItemCreate {
  medicine_id: string
  quantity: number
}

export interface OrderCreate {
  /** Manager-only: which patient the order is for. Customers are auto-linked. */
  patient_id?: string | null
  notes?: string | null
  items: OrderItemCreate[]
}

export type OrderStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export interface Order {
  id: string
  order_number: string
  patient_id: string
  patient_name?: string
  customer_id: string
  status: OrderStatus
  sale_id?: string | null
  bill_number?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  items: OrderItem[]
}

/** Stock / expiry status used by chips, filters and warnings. */
export type StatusLevel = 'expired' | 'expiring' | 'out' | 'low' | 'healthy'
