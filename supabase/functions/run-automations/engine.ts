// Shared automation engine logic for the edge function (Deno)
// Mirrors src/lib/automationUtils.ts + trigger matching rules

export interface GuestRow {
  id: string
  hotel_id: string
  name: string
  phone: string | null
  email: string | null
  room_number: string | null
  check_in: string | null
  check_out: string | null
  created_at: string
}

export interface HotelRow {
  id: string
  name: string
}

export interface AutomationRow {
  id: string
  hotel_id: string
  name: string
  trigger: string
  message_template: string
  is_active: boolean
  last_sent_at: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function renderMessage(
  template: string,
  guest: GuestRow,
  hotel: HotelRow
): string {
  return template
    .replace(/\[Guest Name\]/g, guest.name)
    .replace(/\[Room Number\]/g, guest.room_number ?? '—')
    .replace(/\[Check-in Date\]/g, formatDate(guest.check_in))
    .replace(/\[Check-out Date\]/g, formatDate(guest.check_out))
    .replace(/\[Hotel Name\]/g, hotel.name)
}

function todayKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function addDays(key: string, days: number): string {
  const d = new Date(key + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function hourUTC(): number {
  return new Date().getUTCHours()
}

/** Returns true if current UTC hour is within [start, end) */
function inHourWindow(start: number, end: number): boolean {
  const h = hourUTC()
  return h >= start && h < end
}

export function guestMatchesTrigger(
  guest: GuestRow,
  trigger: string,
  now = new Date()
): boolean {
  const today = todayKey()

  switch (trigger) {
    case 'booking_confirmed': {
      // 65-minute window so hourly cron doesn't miss new guests
      const windowStart = new Date(now.getTime() - 65 * 60 * 1000).toISOString()
      return guest.created_at >= windowStart
    }

    case 'pre_checkin_24h':
      return guest.check_in === addDays(today, 1) && inHourWindow(10, 11)

    case 'checkin_day':
      return guest.check_in === today && inHourWindow(10, 11)

    case 'mid_stay':
      return guest.check_in === addDays(today, -1) && inHourWindow(11, 12)

    case 'pre_checkout':
      return guest.check_out === addDays(today, 1) && inHourWindow(20, 21)

    case 'post_stay':
      return guest.check_out === addDays(today, -1) && inHourWindow(10, 11)

    default:
      return false
  }
}

export function pickChannel(guest: GuestRow): string {
  if (guest.phone) return 'whatsapp'
  if (guest.email) return 'email'
  return 'web'
}
