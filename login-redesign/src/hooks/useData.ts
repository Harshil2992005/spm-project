import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBill,
  createMedicine,
  createPatient,
  createPrescription,
  deleteMedicine,
  deletePatient,
  deletePrescription,
  getBills,
  getMedicines,
  getPatients,
  getPrescriptions,
  sendBillEmail,
  updateMedicine,
  updatePatient,
  updatePrescription,
} from '../lib/api'
import type {
  MedicineCreate,
  MedicineUpdate,
  PatientCreate,
  PatientUpdate,
  PrescriptionCreate,
  PrescriptionUpdate,
  SaleCreate,
} from '../lib/types'

export const qk = {
  medicines: ['medicines'] as const,
  patients: ['patients'] as const,
  prescriptions: ['prescriptions'] as const,
  bills: ['bills'] as const,
}

/* --------------------------------------------------------------- medicines */

export function useMedicines() {
  return useQuery({ queryKey: qk.medicines, queryFn: () => getMedicines({ limit: 500 }) })
}

export function useCreateMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MedicineCreate) => createMedicine(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.medicines })
    },
  })
}

export function useUpdateMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MedicineUpdate }) => updateMedicine(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.medicines })
    },
  })
}

export function useDeleteMedicine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMedicine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.medicines })
    },
  })
}

/* --------------------------------------------------------------- patients */

export function usePatients(enabled = true) {
  return useQuery({ queryKey: qk.patients, queryFn: getPatients, enabled })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PatientCreate) => createPatient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.patients }),
  })
}

export function useUpdatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatientUpdate }) => updatePatient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.patients }),
  })
}

export function useDeletePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.patients }),
  })
}

/* ---------------------------------------------------------- prescriptions */

export function usePrescriptions(enabled = true) {
  return useQuery({ queryKey: qk.prescriptions, queryFn: getPrescriptions, enabled })
}

export function useCreatePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PrescriptionCreate) => createPrescription(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prescriptions }),
  })
}

export function useUpdatePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PrescriptionUpdate }) =>
      updatePrescription(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prescriptions }),
  })
}

export function useDeletePrescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePrescription(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prescriptions }),
  })
}

/* --------------------------------------------------------------- sales */

export function useBills() {
  return useQuery({ queryKey: qk.bills, queryFn: getBills })
}

export function useCreateBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SaleCreate) => createBill(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.bills })
      // Selling decrements stock — refresh the catalogue.
      qc.invalidateQueries({ queryKey: qk.medicines })
    },
  })
}

export function useSendBillEmail() {
  return useMutation({ mutationFn: (id: string) => sendBillEmail(id) })
}
