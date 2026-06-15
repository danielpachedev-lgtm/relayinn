import type { Automation, AutomationTrigger, Guest, Hotel } from '../types'

export function formatAutomationDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function renderAutomationMessage(
  template: string,
  guest: Pick<Guest, 'name' | 'room_number' | 'check_in' | 'check_out'>,
  hotel: Pick<Hotel, 'name'>
): string {
  return template
    .replace(/\[Guest Name\]/g, guest.name)
    .replace(/\[Room Number\]/g, guest.room_number ?? '—')
    .replace(/\[Check-in Date\]/g, formatAutomationDate(guest.check_in))
    .replace(/\[Check-out Date\]/g, formatAutomationDate(guest.check_out))
    .replace(/\[Hotel Name\]/g, hotel.name)
}

export function getAutomationIcon(trigger: AutomationTrigger): string {
  const icons: Record<AutomationTrigger, string> = {
    booking_confirmed: '🎉',
    pre_checkin_24h: '🌅',
    checkin_day: '🏨',
    mid_stay: '☀️',
    pre_checkout: '🧳',
    post_stay: '⭐',
  }
  return icons[trigger]
}

export function getAutomationDisplayName(automation: Automation): string {
  return automation.name
}
