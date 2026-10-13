import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, UserPlus } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import type { Patient, PatientCreate, PatientUpdate } from '../../lib/types'

const GENDERS = ['Male', 'Female', 'Other']

const schema = z.object({
  patient_id: z.string().trim().min(1, 'Patient ID is required'),
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid e-mail').or(z.literal('')).optional(),
  address: z.string().trim().optional(),
  insurance_number: z.string().trim().optional(),
  insurance_provider: z.string().trim().optional(),
  emergency_contact: z.string().trim().optional(),
  medical_history: z.string().trim().optional(),
})

export type PatientFormValues = z.infer<typeof schema>

interface PatientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: Patient | null
  submitting?: boolean
  onSubmit: (values: PatientCreate | PatientUpdate) => void
}

function toDefaults(p?: Patient | null): PatientFormValues {
  return {
    patient_id: p?.patient_id ?? '',
    first_name: p?.first_name ?? '',
    last_name: p?.last_name ?? '',
    date_of_birth: p?.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
    gender: p?.gender ?? 'Male',
    phone: p?.phone ?? '',
    email: p?.email ?? '',
    address: p?.address ?? '',
    insurance_number: p?.insurance_number ?? '',
    insurance_provider: p?.insurance_provider ?? '',
    emergency_contact: p?.emergency_contact ?? '',
    medical_history: p?.medical_history ?? '',
  }
}

/** Blank optional strings → null so the backend stores NULL rather than "". */
function nz(v: string | undefined): string | null {
  const t = (v ?? '').trim()
  return t.length ? t : null
}

export default function PatientFormModal({
  open,
  onOpenChange,
  patient,
  submitting,
  onSubmit,
}: PatientFormModalProps) {
  const editing = Boolean(patient)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientFormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(patient) })

  useEffect(() => {
    if (open) reset(toDefaults(patient))
  }, [open, patient, reset])

  function submit(values: PatientFormValues) {
    const base = {
      first_name: values.first_name,
      last_name: values.last_name,
      date_of_birth: values.date_of_birth,
      gender: nz(values.gender),
      phone: nz(values.phone),
      email: nz(values.email),
      address: nz(values.address),
      insurance_number: nz(values.insurance_number),
      insurance_provider: nz(values.insurance_provider),
      emergency_contact: nz(values.emergency_contact),
      medical_history: nz(values.medical_history),
    }
    // patient_id is immutable on update.
    onSubmit(editing ? base : { ...base, patient_id: values.patient_id.trim() })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit patient' : 'Add new patient'}
      description={editing ? `Update the record for ${patient?.first_name ?? ''} ${patient?.last_name ?? ''}.` : 'Register a patient so they can be billed and prescribed to.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="patient-form"
            variant="primary"
            loading={submitting}
            leftIcon={editing ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          >
            {editing ? 'Save changes' : 'Add patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <Input
          id="patient_id"
          label="Patient ID"
          disabled={editing}
          error={errors.patient_id?.message}
          {...register('patient_id')}
        />
        <Input id="date_of_birth" label="Date of birth" type="date" error={errors.date_of_birth?.message} {...register('date_of_birth')} />

        <Input id="first_name" label="First name" error={errors.first_name?.message} {...register('first_name')} />
        <Input id="last_name" label="Last name" error={errors.last_name?.message} {...register('last_name')} />

        <Select id="gender" label="Gender" {...register('gender')}>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Input id="phone" label="Phone" type="tel" {...register('phone')} />

        <Input id="email" label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
        <Input id="emergency_contact" label="Emergency contact" {...register('emergency_contact')} />

        <Input id="insurance_number" label="Insurance number" {...register('insurance_number')} />
        <Input id="insurance_provider" label="Insurance provider" {...register('insurance_provider')} />

        <Textarea id="address" label="Address" containerClassName="sm:col-span-2" {...register('address')} />
        <Textarea id="medical_history" label="Medical history / allergies" containerClassName="sm:col-span-2" {...register('medical_history')} />
      </form>
    </Modal>
  )
}
