import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { FormSelect } from './FormSelect'
import { useHotelStore } from '../../store/hotelStore'
import { updateHotelProfile, type HotelProfileForm } from '../../lib/settingsService'
import { TIMEZONES, LANGUAGES } from '../../lib/settingsConstants'
import type { Hotel } from '../../types'

function hotelToForm(hotel: Hotel): HotelProfileForm {
  return {
    name: hotel.name,
    email: hotel.email ?? '',
    phone: hotel.phone ?? '',
    website: hotel.website ?? '',
    address: hotel.address ?? '',
    timezone: hotel.timezone ?? 'Europe/Madrid',
    default_language: hotel.default_language ?? 'en',
  }
}

export function HotelProfileSection() {
  const { currentHotel, setHotel } = useHotelStore()
  const [form, setForm] = useState<HotelProfileForm | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentHotel) setForm(hotelToForm(currentHotel))
  }, [currentHotel])

  function updateField<K extends keyof HotelProfileForm>(key: K, value: HotelProfileForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!currentHotel || !form) return
    if (!form.name.trim()) {
      toast.error('Hotel name is required')
      return
    }
    setSaving(true)
    try {
      const updated = await updateHotelProfile(currentHotel.id, form)
      setHotel(updated)
      toast.success('Hotel profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!form) {
    return <p className="text-sm text-[#6B7280]">Loading profile…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <h2 className="text-base font-semibold text-[#111827] mb-1">Hotel Profile</h2>
      <p className="text-sm text-[#6B7280] mb-6">
        Basic information about your property shown to guests and staff.
      </p>

      <div className="bg-white rounded-[10px] border border-[#E5E3DF] p-6 space-y-4">
        <Input
          label="Hotel name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>
        <Input
          label="Website"
          type="url"
          placeholder="https://yourhotel.com"
          value={form.website}
          onChange={(e) => updateField('website', e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="address" className="text-sm font-medium text-[#111827]">
            Address
          </label>
          <textarea
            id="address"
            rows={2}
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E3DF] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            label="Timezone"
            value={form.timezone}
            onChange={(v) => updateField('timezone', v)}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
          />
          <FormSelect
            label="Default language"
            value={form.default_language}
            onChange={(v) => updateField('default_language', v)}
            options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  )
}
