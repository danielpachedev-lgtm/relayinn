import { supabase } from './supabase'
import { APP_NAME } from './brand'
import { HOTEL_PUBLIC_SELECT } from './hotelColumns'
import { ensureTestConversation, sendWhatsAppMessage } from './whatsappService'
import type { Hotel, TeamMember } from '../types'

export interface HotelProfileForm {
  name: string
  email: string
  phone: string
  website: string
  address: string
  timezone: string
  default_language: string
}

export async function updateHotelProfile(
  hotelId: string,
  form: HotelProfileForm
): Promise<Hotel> {
  const { data, error } = await supabase
    .from('hotels')
    .update({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      timezone: form.timezone,
      default_language: form.default_language,
    })
    .eq('id', hotelId)
    .select(HOTEL_PUBLIC_SELECT)
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Update failed')
  return data as Hotel
}

export async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase.rpc('get_hotel_team')
  if (error) throw new Error(error.message)
  return (data ?? []) as TeamMember[]
}

export async function updateStaffRole(
  staffId: string,
  role: 'manager' | 'staff'
): Promise<void> {
  const { error } = await supabase.from('staff').update({ role }).eq('id', staffId)
  if (error) throw new Error(error.message)
}

export async function removeStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase.from('staff').delete().eq('id', staffId)
  if (error) throw new Error(error.message)
}

export async function exchangeMetaWhatsAppCode(code: string): Promise<Hotel> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Session expired. Please log in again.')
  }

  const { data, error } = await supabase.functions.invoke('meta-exchange-token', {
    body: { code },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error) throw new Error(error.message)
  if (!data?.success) throw new Error(data?.error ?? 'Failed to connect WhatsApp')

  if (data.hotel) return data.hotel as Hotel
  throw new Error('Failed to load connected hotel')
}

export async function disconnectWhatsApp(hotelId: string): Promise<Hotel> {
  const { data, error } = await supabase
    .from('hotels')
    .update({
      whatsapp_connected: false,
      whatsapp_phone: null,
      whatsapp_phone_number_id: null,
      meta_access_token: null,
      meta_waba_id: null,
    })
    .eq('id', hotelId)
    .select(HOTEL_PUBLIC_SELECT)
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Disconnect failed')
  return data as Hotel
}

export async function sendTestWhatsApp(
  hotelId: string,
  hotelPhone: string,
  staffId: string
): Promise<void> {
  const message =
    `Hello from ${APP_NAME}! Your WhatsApp is successfully connected via Meta Cloud API.`
  const conversationId = await ensureTestConversation(hotelId, hotelPhone)
  const result = await sendWhatsAppMessage(conversationId, message, staffId)
  if (!result.success) {
    throw new Error(result.error ?? 'Failed to send test message')
  }
}

export async function fetchUsageStats(hotelId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [conversationsRes, staffRes] = await Promise.all([
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .gte('created_at', startOfMonth.toISOString()),
    supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotelId),
  ])

  return {
    conversations: conversationsRes.count ?? 0,
    teamMembers: staffRes.count ?? 0,
  }
}

export async function refreshHotel(hotelId: string): Promise<Hotel | null> {
  const { data, error } = await supabase
    .from('hotels')
    .select(HOTEL_PUBLIC_SELECT)
    .eq('id', hotelId)
    .single()
  if (error || !data) return null
  return data as Hotel
}
