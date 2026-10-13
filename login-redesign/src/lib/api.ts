/**
 * Pluggable API layer for PharmaMS.
 * ---------------------------------------------------------------------------
 * Every network call lives here and matches the existing FastAPI contracts
 * (prefix /api/v1). The UI never touches `fetch` directly, so swapping backends
 * means editing only this file.
 *
 *   POST /auth/login       (form-urlencoded: username, password) -> Token
 *   POST /auth/request-otp (json: { identifier })                -> OTPResponse
 *   POST /auth/verify-otp  (json: { username, otp })             -> Token
 *   POST /auth/google      (json: { credential })                -> Token
 *   GET  /auth/me                                                -> UserOut
 *   GET/POST/PUT/DELETE /medicines/...
 *   GET/POST/PUT/DELETE /patients/...
 *   GET/POST/PUT/DELETE /prescriptions/...
 *   GET/POST /sales/...
 *
 * Set the base URL with VITE_API_BASE (defaults to "/api/v1" so the Vite dev
 * proxy or a same-origin deploy just works). Set VITE_USE_MOCK=true to run
 * entirely on in-memory demo data.
 */
import { mockApi } from './mock'
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

const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/v1'
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === 'true'

export interface Token {
  access_token: string
  token_type: string
}

export interface OtpRequestResult {
  message: string
  email_sent: boolean
  debug_otp?: string | null
}

/** Error thrown by the API layer carrying the HTTP status for the UI mapper. */
export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status = 0, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/* ------------------------------------------------------------------ token */

const TOKEN_KEY = 'pms_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function persistToken(token: Token): void {
  try {
    localStorage.setItem(TOKEN_KEY, token.access_token)
  } catch {
    /* storage may be blocked (private mode) — non-fatal */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** Fired whenever the server rejects our token, so the app can redirect. */
export const UNAUTHORIZED_EVENT = 'pms:unauthorized'

/* ------------------------------------------------------------------ core */

interface HttpOptions {
  method?: string
  body?: unknown
  /** Send without the Authorization header (e.g. login). */
  anonymous?: boolean
  signal?: AbortSignal
}

/** FastAPI errors: {detail: "text"} or {detail: [{loc, msg}]} -> one readable string. */
function extractDetail(parsed: unknown): string {
  if (!parsed || typeof parsed !== 'object' || !('detail' in parsed)) return ''
  const d = (parsed as { detail: unknown }).detail
  if (Array.isArray(d)) {
    return d
      .map((e) => {
        const item = e as { loc?: unknown[]; msg?: string }
        const field = Array.isArray(item.loc) ? String(item.loc[item.loc.length - 1] ?? '') : ''
        return field ? `${field.replace(/_/g, ' ')}: ${item.msg ?? ''}` : item.msg ?? ''
      })
      .join('; ')
  }
  return String(d)
}

async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  let body: BodyInit | undefined

  if (opts.body instanceof FormData) {
    body = opts.body
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  if (!opts.anonymous) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body,
      signal: opts.signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    throw new ApiError('Network request failed', 0, 'network')
  }

  const text = await res.text()
  let parsed: unknown = undefined
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !opts.anonymous) {
      clearToken()
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }
    // FastAPI validation errors arrive as a list of {loc,msg}.
    const detail = extractDetail(parsed) || (typeof parsed === 'string' ? parsed : '')
    throw new ApiError(detail || `Request failed (${res.status})`, res.status)
  }

  return parsed as T
}

/* ------------------------------------------------------------------ auth */

/** Username/e-mail + password sign in. */
export async function loginWithPassword(identifier: string, password: string): Promise<Token> {
  const form = new URLSearchParams()
  form.set('username', identifier) // backend accepts username OR e-mail here
  form.set('password', password)
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
  let res: Response
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers,
      body: form.toString(),
    })
  } catch {
    throw new ApiError('Network request failed', 0, 'network')
  }
  const text = await res.text()
  let parsed: unknown = {}
  try {
    parsed = text ? JSON.parse(text) : {}
  } catch {
    parsed = {}
  }
  if (!res.ok) {
    throw new ApiError(extractDetail(parsed) || `Request failed (${res.status})`, res.status)
  }
  return parsed as Token
}

export interface RegisterPayload {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
}

/** Public sign-up (always creates a Customer account). */
export async function registerUser(payload: RegisterPayload): Promise<AuthUser> {
  return http<AuthUser>('/auth/register', { method: 'POST', body: payload, anonymous: true })
}

export async function sendOtp(identifier: string): Promise<OtpRequestResult> {
  return http<OtpRequestResult>('/auth/request-otp', { method: 'POST', body: { identifier }, anonymous: true })
}

export async function verifyOtp(username: string, otp: string): Promise<Token> {
  return http<Token>('/auth/verify-otp', { method: 'POST', body: { username, otp }, anonymous: true })
}

export async function loginWithGoogle(credential: string): Promise<Token> {
  return http<Token>('/auth/google', { method: 'POST', body: { credential }, anonymous: true })
}

export interface GoogleConfig {
  enabled: boolean
  client_id: string
}

export async function fetchGoogleConfig(): Promise<GoogleConfig> {
  return http<GoogleConfig>('/auth/google/config', { anonymous: true })
}

export async function getMe(): Promise<AuthUser> {
  if (USE_MOCK) return mockApi.getMe()
  return http<AuthUser>('/auth/me')
}

/* ------------------------------------------------------------------ medicines */

export async function getMedicines(params?: { skip?: number; limit?: number }): Promise<Medicine[]> {
  if (USE_MOCK) return mockApi.getMedicines(params)
  const skip = params?.skip ?? 0
  const limit = params?.limit ?? 100
  return http<Medicine[]>(`/medicines/?skip=${skip}&limit=${limit}`)
}

export async function getMedicine(id: string): Promise<Medicine> {
  if (USE_MOCK) return mockApi.getMedicine(id)
  return http<Medicine>(`/medicines/${id}`)
}

export async function createMedicine(payload: MedicineCreate): Promise<Medicine> {
  if (USE_MOCK) return mockApi.createMedicine(payload)
  return http<Medicine>('/medicines/', { method: 'POST', body: payload })
}

export async function updateMedicine(id: string, payload: MedicineUpdate): Promise<Medicine> {
  if (USE_MOCK) return mockApi.updateMedicine(id, payload)
  return http<Medicine>(`/medicines/${id}`, { method: 'PUT', body: payload })
}

export async function deleteMedicine(id: string): Promise<{ message: string }> {
  if (USE_MOCK) return mockApi.deleteMedicine(id)
  return http<{ message: string }>(`/medicines/${id}`, { method: 'DELETE' })
}

/* ------------------------------------------------------------------ patients */

export async function getPatients(): Promise<Patient[]> {
  if (USE_MOCK) return mockApi.getPatients()
  return http<Patient[]>('/patients/')
}

export async function createPatient(payload: PatientCreate): Promise<Patient> {
  if (USE_MOCK) return mockApi.createPatient(payload)
  return http<Patient>('/patients/', { method: 'POST', body: payload })
}

export async function updatePatient(id: string, payload: PatientUpdate): Promise<Patient> {
  if (USE_MOCK) return mockApi.updatePatient(id, payload)
  return http<Patient>(`/patients/${id}`, { method: 'PUT', body: payload })
}

export async function deletePatient(id: string): Promise<{ message: string }> {
  if (USE_MOCK) return mockApi.deletePatient(id)
  return http<{ message: string }>(`/patients/${id}`, { method: 'DELETE' })
}

/* ------------------------------------------------------------------ sales */

export async function getBills(): Promise<Sale[]> {
  if (USE_MOCK) return mockApi.getBills()
  return http<Sale[]>('/sales/')
}

export async function getBill(id: string): Promise<Sale> {
  if (USE_MOCK) return mockApi.getBill(id)
  return http<Sale>(`/sales/${id}`)
}

export async function createBill(payload: SaleCreate): Promise<Sale> {
  if (USE_MOCK) return mockApi.createBill(payload)
  return http<Sale>('/sales/', { method: 'POST', body: payload })
}

export async function sendBillEmail(id: string): Promise<{ sent: boolean; message: string }> {
  if (USE_MOCK) return mockApi.sendBillEmail(id)
  return http(`/sales/${id}/send-email`, { method: 'POST' })
}

/* ----------------------------------------------------------- prescriptions */

export async function getPrescriptions(): Promise<Prescription[]> {
  if (USE_MOCK) return mockApi.getPrescriptions()
  return http<Prescription[]>('/prescriptions/')
}

export async function createPrescription(payload: PrescriptionCreate): Promise<Prescription> {
  if (USE_MOCK) return mockApi.createPrescription(payload)
  return http<Prescription>('/prescriptions/', { method: 'POST', body: payload })
}

export async function updatePrescription(id: string, payload: PrescriptionUpdate): Promise<Prescription> {
  if (USE_MOCK) return mockApi.updatePrescription(id, payload)
  return http<Prescription>(`/prescriptions/${id}`, { method: 'PUT', body: payload })
}

export async function deletePrescription(id: string): Promise<{ message: string }> {
  if (USE_MOCK) return mockApi.deletePrescription(id)
  return http<{ message: string }>(`/prescriptions/${id}`, { method: 'DELETE' })
}
