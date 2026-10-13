import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Save, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import type {
  Medicine,
  Patient,
  Prescription,
  PrescriptionCreate,
  PrescriptionItemCreate,
  PrescriptionUpdate,
} from '../../lib/types'

const STATUSES = ['Pending', 'Filled', 'Partially Filled', 'Cancelled']

const schema = z.object({
  patient_id: z.string().optional(),
  doctor_name: z.string().trim().min(1, 'Doctor name is required'),
  doctor_license: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  status: z.string(),
})

export type PrescriptionFormValues = z.infer<typeof schema>

interface PrescriptionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prescription?: Prescription | null
  patients: Patient[]
  medicines: Medicine[]
  submitting?: boolean
  onSubmit: (values: PrescriptionCreate | PrescriptionUpdate) => void
}

function toDefaults(p?: Prescription | null): PrescriptionFormValues {
  return {
    patient_id: p?.patient_id ?? '',
    doctor_name: p?.doctor_name ?? '',
    doctor_license: p?.doctor_license ?? '',
    diagnosis: p?.diagnosis ?? '',
    issue_date: p?.issue_date ? String(p.issue_date).slice(0, 10) : '',
    expiry_date: p?.expiry_date ? String(p.expiry_date).slice(0, 10) : '',
    status: p?.status ?? 'Pending',
  }
}

function nz(v: string | undefined): string | null {
  const t = (v ?? '').trim()
  return t.length ? t : null
}

export default function PrescriptionFormModal({
  open,
  onOpenChange,
  prescription,
  patients,
  medicines,
  submitting,
  onSubmit,
}: PrescriptionFormModalProps) {
  const editing = Boolean(prescription)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(prescription) })

  const [items, setItems] = useState<PrescriptionItemCreate[]>([])
  const [item, setItem] = useState({ medicine_id: '', quantity_prescribed: '', dosage_instructions: '' })

  useEffect(() => {
    if (open) {
      reset(toDefaults(prescription))
      setItems([])
      setItem({ medicine_id: '', quantity_prescribed: '', dosage_instructions: '' })
    }
  }, [open, prescription, reset])

  const patientId = watch('patient_id')

  const medicineName = useMemo(() => {
    const map = new Map(medicines.map((m) => [m.id, m]))
    return (id: string) => map.get(id)?.name ?? 'Medicine'
  }, [medicines])

  function addItem() {
    const qty = Number(item.quantity_prescribed)
    if (!item.medicine_id || !Number.isFinite(qty) || qty <= 0) return
    setItems((prev) => [
      ...prev,
      {
        medicine_id: item.medicine_id,
        quantity_prescribed: qty,
        quantity_dispensed: 0,
        dosage_instructions: nz(item.dosage_instructions),
      },
    ])
    setItem({ medicine_id: '', quantity_prescribed: '', dosage_instructions: '' })
  }

  function submit(values: PrescriptionFormValues) {
    const base = {
      doctor_name: values.doctor_name.trim(),
      doctor_license: nz(values.doctor_license),
      diagnosis: nz(values.diagnosis),
      issue_date: nz(values.issue_date),
      expiry_date: nz(values.expiry_date),
      status: values.status,
    }
    if (editing) {
      onSubmit(base)
    } else {
      onSubmit({
        ...base,
        patient_id: values.patient_id ?? '',
        prescription_number: `RX-${Date.now()}`,
        items,
      })
    }
  }

  const canSubmit = editing || (Boolean(patientId) && items.length > 0)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit prescription' : 'New prescription'}
      description={editing ? prescription?.prescription_number ?? undefined : 'Record a doctor’s prescription and the medicines to dispense.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="prescription-form"
            variant="primary"
            loading={submitting}
            disabled={!editing && !patientId}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {editing ? 'Save changes' : 'Create prescription'}
          </Button>
        </>
      }
    >
      <form id="prescription-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        {!editing && (
          <Select
            id="patient_id"
            label="Patient"
            containerClassName="sm:col-span-2"
            {...register('patient_id')}
          >
            <option value="">Select a patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_id} — {p.first_name} {p.last_name}
              </option>
            ))}
          </Select>
        )}

        <Input id="doctor_name" label="Doctor name" error={errors.doctor_name?.message} {...register('doctor_name')} />
        <Input id="doctor_license" label="Doctor licence" {...register('doctor_license')} />

        <Select id="status" label="Status" {...register('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input id="issue_date" label="Issue date" type="date" {...register('issue_date')} />

        {editing && <Input id="expiry_date" label="Expiry date" type="date" {...register('expiry_date')} />}

        <Textarea
          id="diagnosis"
          label="Diagnosis / notes"
          containerClassName="sm:col-span-2"
          {...register('diagnosis')}
        />

        {!editing && (
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Prescribed medicines</h3>
              <span className="text-xs text-muted">{items.length} item{items.length === 1 ? '' : 's'}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <Select
                  id="item_medicine"
                  label="Medicine"
                  value={item.medicine_id}
                  onChange={(e) => setItem({ ...item, medicine_id: e.target.value })}
                >
                  <option value="">Select…</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.medicine_code} — {m.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-3">
                <Input
                  id="item_qty"
                  label="Qty"
                  type="number"
                  min={1}
                  value={item.quantity_prescribed}
                  onChange={(e) => setItem({ ...item, quantity_prescribed: e.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={addItem}
                  disabled={!item.medicine_id || !item.quantity_prescribed}
                >
                  Add
                </Button>
              </div>
              <div className="sm:col-span-12">
                <Input
                  id="item_dosage"
                  label="Dosage instructions"
                  value={item.dosage_instructions}
                  onChange={(e) => setItem({ ...item, dosage_instructions: e.target.value })}
                />
              </div>
            </div>

            {items.length > 0 && (
              <ul className="mt-3 divide-y divide-line/15 overflow-hidden rounded-2xl border border-line/30">
                {items.map((it, i) => (
                  <li key={`${it.medicine_id}-${i}`} className="flex items-center justify-between gap-3 bg-white/50 px-4 py-2.5 dark:bg-white/5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{medicineName(it.medicine_id)}</p>
                      <p className="text-[11px] text-muted">{it.dosage_instructions || 'No dosage instructions'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular text-sm text-ink-soft">×{it.quantity_prescribed}</span>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => setItems((prev) => prev.filter((_, idx) => i !== idx))}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  )
}
