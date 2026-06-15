export const DEFAULT_QUICK_REPLIES = [
  {
    name: 'Check-in info',
    message:
      "Hello [Guest Name]! Check-in is from 3:00 PM. Let us know your ETA and we'll have everything ready 😊",
    sort_order: 0,
  },
  {
    name: 'Check-out reminder',
    message:
      'Good morning [Guest Name]! Check-out is by 12:00 PM today. Let us know if you need anything!',
    sort_order: 1,
  },
  {
    name: 'WiFi details',
    message: 'Hi [Guest Name]! WiFi: [WIFI_NAME] / Password: [WIFI_PASSWORD] 📶',
    sort_order: 2,
  },
  {
    name: 'Parking info',
    message:
      "Hello [Guest Name]! We have complimentary parking. Please share your vehicle details and we'll reserve a spot.",
    sort_order: 3,
  },
  {
    name: 'Late check-out',
    message:
      'Hello [Guest Name]! Late check-out until 2:00 PM is available for €20. Shall we arrange it?',
    sort_order: 4,
  },
  {
    name: 'Review request',
    message:
      'Thank you for staying with us, [Guest Name]! We\'d love your feedback: [REVIEW_LINK] ⭐',
    sort_order: 5,
  },
]

export const QUICK_REPLY_VARIABLES = [
  '[Guest Name]',
  '[Room Number]',
  '[Hotel Name]',
  '[Check-in Date]',
  '[Check-out Date]',
] as const

export const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Asia/Dubai',
  'Asia/Singapore',
] as const

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
] as const

export const PLAN_LIMITS = {
  starter: { team: 3, conversations: 500 },
  pro: { team: 10, conversations: null },
} as const

export const PLANS = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: '$39/mo',
    features: [
      'Up to 3 team members',
      '500 conversations/month',
      '6 automations',
      'WhatsApp + Email',
      'Email support',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$79/mo',
    features: [
      'Up to 10 team members',
      'Unlimited conversations',
      'All automations',
      'WhatsApp + Email + Instagram',
      'Priority support',
      'PMS integrations',
    ],
  },
]
