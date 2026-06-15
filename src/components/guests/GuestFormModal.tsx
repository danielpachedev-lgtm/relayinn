import { useState, useEffect, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { Guest } from '../../types'
import type { GuestFormData } from '../../lib/guestService'

interface GuestFormModalProps {
  open: boolean
  mode: 'add' | 'edit'
  guest?: Guest | null
  onClose: () => void
  onSubmit: (data: GuestFormData) => Promise<void>
}

const EMPTY_FORM: GuestFormData = {
  name: '',
  phone: '',
  email: '',
  room_number: '',
  check_in: '',
  check_out: '',
  notes: '',
}

function guestToForm(guest: Guest): GuestFormData {
  return {
    name: guest.name,
    phone: guest.phone ?? '',
    email: guest.email ?? '',
    room_number: guest.room_number ?? '',
    check_in: guest.check_in ?? '',
    check_out: guest.check_out ?? '',
    notes: guest.notes ?? '',
  }
}

export function GuestFormModal({
  open,
  mode,
  guest,
  onClose,
  onSubmit,
}: GuestFormModalProps) {
  const [form, setForm] = useState<GuestFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(mode === 'edit' && guest ? guestToForm(guest) : EMPTY_FORM)
      setError('')
    }
  }, [open, mode, guest])

  function updateField<K extends keyof GuestFormData>(key: K, value: GuestFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Full name is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add Guest' : 'Edit Guest'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Jane Smith"
          required
        />
        <Input
          label="Phone number"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+1 234 567 8900"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="guest@email.com"
        />
        <Input
          label="Room number"
          value={form.room_number}
          onChange={(e) => updateField('room_number', e.target.value)}
          placeholder="204"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Check-in date"
            type="date"
            value={form.check_in}
            onChange={(e) => updateField('check_in', e.target.value)}
          />
          <Input
            label="Check-out date"
            type="date"
            value={form.check_out}
            onChange={(e) => updateField('check_out', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#111827]">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="VIP guest, allergic to nuts, prefers quiet room..."
            rows={3}
            className="w-full px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E3DF] rounded-[8px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {mode === 'add' ? 'Add Guest' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
