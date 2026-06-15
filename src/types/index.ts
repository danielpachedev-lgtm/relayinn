export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled'
export type PlanId = 'starter' | 'pro'

export interface Hotel {
  id: string
  name: string
  email: string | null
  phone: string | null
  plan: PlanId
  website: string | null
  address: string | null
  timezone: string | null
  default_language: string | null
  whatsapp_phone: string | null
  whatsapp_connected: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  subscription_status: SubscriptionStatus
  current_period_end: string | null
  created_at: string
}

export interface Staff {
  id: string
  hotel_id: string
  user_id: string
  name: string
  role: 'owner' | 'manager' | 'staff'
  avatar_url: string | null
  created_at: string
}

export interface TeamMember extends Staff {
  email: string | null
}

export interface QuickReply {
  id: string
  hotel_id: string
  name: string
  message: string
  sort_order: number
  created_at: string
}

export interface Guest {
  id: string
  hotel_id: string
  name: string
  phone: string | null
  email: string | null
  room_number: string | null
  check_in: string | null
  check_out: string | null
  notes: string | null
  created_at: string
}

export interface GuestWithMeta extends Guest {
  conversation_count: number
}

export type ConversationChannel = 'whatsapp' | 'email' | 'instagram' | 'web'
export type ConversationStatus = 'open' | 'in_progress' | 'resolved'

export interface Conversation {
  id: string
  hotel_id: string
  guest_id: string | null
  channel: ConversationChannel
  status: ConversationStatus
  assigned_to: string | null
  is_urgent: boolean
  last_message_at: string
  created_at: string
  guest?: Guest
  assigned_staff?: Staff
  unread_count?: number
  last_message?: Pick<Message, 'id' | 'content' | 'sender_type' | 'read_at' | 'created_at'>
}

export type SenderType = 'guest' | 'staff' | 'system'

export interface Message {
  id: string
  conversation_id: string
  sender_type: SenderType
  sender_id: string | null
  content: string
  is_internal_note: boolean
  read_at: string | null
  created_at: string
}

export type AutomationTrigger =
  | 'booking_confirmed'
  | 'pre_checkin_24h'
  | 'checkin_day'
  | 'mid_stay'
  | 'pre_checkout'
  | 'post_stay'

export interface Automation {
  id: string
  hotel_id: string
  name: string
  trigger: AutomationTrigger
  message_template: string
  is_active: boolean
  last_sent_at: string | null
  created_at: string
}

export interface AutomationLog {
  id: string
  hotel_id: string
  automation_id: string
  guest_id: string
  trigger: AutomationTrigger
  message_sent: string
  sent_at: string
}
