import type { AutomationTrigger } from '../types'

export interface AutomationDefinition {
  trigger: AutomationTrigger
  name: string
  icon: string
  description: string
  defaultTemplate: string
}

export const AUTOMATION_DEFINITIONS: AutomationDefinition[] = [
  {
    trigger: 'booking_confirmed',
    name: 'Booking Confirmed',
    icon: '🎉',
    description: 'Sent immediately when a new reservation is created',
    defaultTemplate:
      "Hello [Guest Name]! Your reservation at [Hotel Name] is confirmed. Room [Room Number] from [Check-in Date] to [Check-out Date]. Any questions, we're here to help!",
  },
  {
    trigger: 'pre_checkin_24h',
    name: 'Pre-arrival (24h before)',
    icon: '🌅',
    description: 'Sent 24 hours before check-in',
    defaultTemplate:
      "Hi [Guest Name]! We're looking forward to welcoming you tomorrow. Check-in is from 3:00 PM. Please let us know your estimated arrival time!",
  },
  {
    trigger: 'checkin_day',
    name: 'Check-in Day',
    icon: '🏨',
    description: 'Sent at 10:00 AM on the day of arrival',
    defaultTemplate:
      'Good morning [Guest Name]! Today is the day 🎊 Check-in is from 3:00 PM at [Hotel Name]. Room [Room Number] will be ready for you. Safe travels!',
  },
  {
    trigger: 'mid_stay',
    name: 'Mid-stay Check-in',
    icon: '☀️',
    description: 'Sent on the second day of the stay',
    defaultTemplate:
      "Hi [Guest Name]! Hope you're enjoying your stay at [Hotel Name]. Is everything comfortable in room [Room Number]? Let us know if you need anything at all!",
  },
  {
    trigger: 'pre_checkout',
    name: 'Pre-checkout Reminder',
    icon: '🧳',
    description: 'Sent at 8:00 PM the evening before check-out',
    defaultTemplate:
      "Good evening [Guest Name]! Just a reminder that check-out is tomorrow by 12:00 PM. Need help with luggage, a taxi, or a late check-out? We're happy to help!",
  },
  {
    trigger: 'post_stay',
    name: 'Post-stay Review Request',
    icon: '⭐',
    description: 'Sent 24 hours after check-out',
    defaultTemplate:
      "Thank you for staying with us, [Guest Name]! We hope you had a wonderful experience at [Hotel Name]. We'd love to hear your feedback — it helps us improve for your next visit!",
  },
]

export const AUTOMATION_VARIABLES = [
  '[Guest Name]',
  '[Room Number]',
  '[Check-in Date]',
  '[Check-out Date]',
  '[Hotel Name]',
] as const

export function getDefinitionByTrigger(
  trigger: AutomationTrigger
): AutomationDefinition | undefined {
  return AUTOMATION_DEFINITIONS.find((d) => d.trigger === trigger)
}
