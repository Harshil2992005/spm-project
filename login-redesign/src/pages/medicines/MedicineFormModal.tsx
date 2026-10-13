import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { cn } from '../../lib/cn'
import type { Medicine, MedicineCreate, MedicineUpdate } from '../../lib/types'

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Sachet']

const schema = z.object({
  medicine_code: z.string().trim().min(1, 'Code is required'),
  name: z.string().trim().min(1, 'Name is required'),
  generic_name: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  dosage_form: z.string().trim().optional(),
  strength: z.string().trim().optional(),
  unit_price: z.coerce.number({ invalid_type_error: 'Enter a price' }).min(0, 'Must be ≥ 0'),
  purchase_price: z.coerce.number({ invalid_type_error: 'Enter a cost' }).min(0, 'Must be ≥ 0'),
  quantity_in_stock: z.coerce
    .number({ invalid_type_error: 'Enter a quantity' })
    .int('Whole numbers only')
    .min(0, 'Must be ≥ 0'),
  minimum_stock_level: z.coerce
    .number({ invalid_type_error: 'Enter a level' })
    .int('Whole numbers only')
    .min(0, 'Must be ≥ 0'),
  maximum_stock_level: z.coerce.number().int().min(0).optional(),
  batch_number: z.string().trim().optional(),
  manufacture_date: z.string().optional(),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  storage_location: z.string().trim().optional(),
  is_active: z.boolean(),
})

export type MedicineFormValues = z.infer<typeof schema>

interface MedicineFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicine?: Medicine | null
  submitting?: boolean
  onSubmit: (values: MedicineCreate | MedicineUpdate) => void
}

function toDefaults(m?: Medicine | null): MedicineFormValues {
  return {
    medicine_code: m?.medicine_code ?? '',
    name: m?.name ?? '',
    generic_name: m?.generic_name ?? '',
    manufacturer: m?.manufacturer ?? '',
    dosage_form: m?.dosage_form ?? 'Tablet',
    strength: m?.strength ?? '',
    unit_price: m?.unit_price ?? 0,
    purchase_price: m?.purchase_price ?? 0,
    quantity_in_stock: m?.quantity_in_stock ?? 0,
    minimum_stock_level: m?.minimum_stock_level ?? 20,
    maximum_stock_level: m?.maximum_stock_level ?? undefined,
    batch_number: m?.batch_number ?? '',
    manufacture_date: m?.manufacture_date ? m.manufacture_date.slice(0, 10) : '',
    expiry_date: m?.expiry_date ? m.expiry_date.slice(0, 10) : '',
    storage_location: m?.storage_location ?? '',
    is_active: m?.is_active ?? true,
  }
}

/** Blank optional strings → null so the backend stores NULL rather than "". */
function nz(v: string | undefined): string | null {
  const t = (v ?? '').trim()
  return t.length ? t : null
}

export default function MedicineFormModal({
  open,
  onOpenChange,
  medicine,
  submitting,
  onSubmit,
}: MedicineFormModalProps) {
  const editing = Boolean(medicine)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MedicineFormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(medicine) })

  // Re-seed the form whenever the target record (or open state) changes.
  useEffect(() => {
    if (open) reset(toDefaults(medicine))
  }, [open, medicine, reset])

  const isActive = watch('is_active')

  function submit(values: MedicineFormValues) {
    const base = {
      name: values.name,
      generic_name: nz(values.generic_name),
      manufacturer: nz(values.manufacturer),
      dosage_form: nz(values.dosage_form),
      strength: nz(values.strength),
      unit_price: values.unit_price,
      purchase_price: values.purchase_price,
      quantity_in_stock: values.quantity_in_stock,
      minimum_stock_level: values.minimum_stock_level,
      maximum_stock_level:
        typeof values.maximum_stock_level === 'number' ? values.maximum_stock_level : null,
      batch_number: nz(values.batch_number),
      manufacture_date: nz(values.manufacture_date),
      expiry_date: values.expiry_date,
      storage_location: nz(values.storage_location),
      is_active: values.is_active,
    }
    // The backend does not accept medicine_code on update.
    onSubmit(editing ? base : { ...base, medicine_code: values.medicine_code })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit medicine' : 'Add medicine'}
      description={editing ? `Updating ${medicine?.name}` : 'Create a new item in the inventory.'}
      size="lg"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="medicine-form" variant="primary" loading={submitting} leftIcon={<Save className="h-4 w-4" />}>
            {editing ? 'Save changes' : 'Add medicine'}
          </Button>
        </>
      }
    >
      <form id="medicine-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2">
        <Input
          id="medicine_code"
          label="Medicine code"
          disabled={editing}
          error={errors.medicine_code?.message}
          icon={undefined}
          {...register('medicine_code')}
        />
        <Input id="name" label="Brand name" error={errors.name?.message} {...register('name')} />
        <Input id="generic_name" label="Generic name" {...register('generic_name')} />
        <Input id="manufacturer" label="Manufacturer" {...register('manufacturer')} />

        <Select id="dosage_form" label="Dosage form" {...register('dosage_form')}>
          {DOSAGE_FORMS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <Input id="strength" label="Strength (e.g. 500 mg)" {...register('strength')} />

        <Input
          id="unit_price"
          label="Selling price (₹)"
          type="number"
          step="0.01"
          error={errors.unit_price?.message}
          {...register('unit_price')}
        />
        <Input
          id="purchase_price"
          label="Purchase price (₹)"
          type="number"
          step="0.01"
          error={errors.purchase_price?.message}
          {...register('purchase_price')}
        />

        <Input
          id="quantity_in_stock"
          label="Quantity in stock"
          type="number"
          error={errors.quantity_in_stock?.message}
          {...register('quantity_in_stock')}
        />
        <Input
          id="minimum_stock_level"
          label="Minimum stock level"
          type="number"
          error={errors.minimum_stock_level?.message}
          {...register('minimum_stock_level')}
        />
        <Input id="maximum_stock_level" label="Maximum stock level" type="number" {...register('maximum_stock_level')} />
        <Input id="batch_number" label="Batch number" {...register('batch_number')} />

        <Input id="manufacture_date" label="Manufacture date" type="date" {...register('manufacture_date')} />
        <Input
          id="expiry_date"
          label="Expiry date"
          type="date"
          error={errors.expiry_date?.message}
          {...register('expiry_date')}
        />
        <Input id="storage_location" label="Storage location" containerClassName="sm:col-span-2" {...register('storage_location')} />

        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-line/40 bg-white/70 px-4 py-3 sm:col-span-2 dark:bg-white/5">
          <span>
            <span className="block text-sm font-semibold text-ink">Active</span>
            <span className="block text-xs text-muted">Inactive medicines are hidden from billing.</span>
          </span>
          <span
            role="switch"
            aria-checked={isActive}
            onClick={() => setValue('is_active', !isActive, { shouldDirty: true })}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              isActive ? 'bg-brand-600' : 'bg-surface-3',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                isActive ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </span>
          <input type="checkbox" className="sr-only" {...register('is_active')} />
        </label>
      </form>
    </Modal>
  )
}
