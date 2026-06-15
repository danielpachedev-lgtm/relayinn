export type GuestStayStatus = 'arriving' | 'in_house' | 'checked_out' | 'upcoming'

export const GUEST_STAY_LABELS: Record<GuestStayStatus, string> = {
  arriving: 'Arriving',
  in_house: 'In House',
  checked_out: 'Checked Out',
  upcoming: 'Upcoming',
}

export const GUEST_STAY_STYLES: Record<GuestStayStatus, string> = {
  arriving: 'bg-[#EFF6FF] text-[#2563EB]',
  in_house: 'bg-[#F0FDF4] text-[#16A34A]',
  checked_out: 'bg-[#F3F4F6] text-[#6B7280]',
  upcoming: 'bg-[#FEF3C7] text-[#D97706]',
}

export function getTodayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getGuestStayStatus(
  checkIn: string | null,
  checkOut: string | null
): GuestStayStatus | null {
  if (!checkIn && !checkOut) return null

  const today = getTodayKey()
  const inDate = checkIn ?? checkOut!
  const outDate = checkOut ?? checkIn!

  if (checkIn && checkIn === today) return 'arriving'
  if (checkIn && checkIn > today) return 'upcoming'
  if (checkOut && checkOut < today) return 'checked_out'
  if (checkIn && checkIn < today && checkOut && checkOut >= today) return 'in_house'

  if (inDate <= today && outDate >= today) return 'in_house'
  if (outDate < today) return 'checked_out'
  if (inDate > today) return 'upcoming'

  return null
}

export function formatGuestDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatGuestDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}
