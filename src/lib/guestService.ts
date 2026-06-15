import { supabase } from './supabase'
import { sendAutomationToGuest } from './automationService'
import type { Automation, Conversation, Guest, Hotel } from '../types'

export interface GuestFormData {
  name: string
  phone: string
  email: string
  room_number: string
  check_in: string
  check_out: string
  notes: string
}

function toNullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}

export async function createGuest(
  hotelId: string,
  form: GuestFormData
): Promise<Guest> {
  const payload = {
    hotel_id: hotelId,
    name: form.name.trim(),
    phone: toNullable(form.phone),
    email: toNullable(form.email),
    room_number: toNullable(form.room_number),
    check_in: toNullable(form.check_in),
    check_out: toNullable(form.check_out),
    notes: toNullable(form.notes),
  }

  const { data, error } = await supabase
    .from('guests')
    .insert(payload)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create guest')

  if (payload.phone) {
    const { error: convoError } = await supabase.from('conversations').insert({
      hotel_id: hotelId,
      guest_id: data.id,
      channel: 'whatsapp',
      status: 'open',
    })
    if (convoError) throw new Error(convoError.message)
  }

  await triggerBookingConfirmedIfActive(hotelId, data as Guest)

  return data as Guest
}

export async function updateGuest(
  guestId: string,
  form: GuestFormData
): Promise<Guest> {
  const payload = {
    name: form.name.trim(),
    phone: toNullable(form.phone),
    email: toNullable(form.email),
    room_number: toNullable(form.room_number),
    check_in: toNullable(form.check_in),
    check_out: toNullable(form.check_out),
    notes: toNullable(form.notes),
  }

  const { data, error } = await supabase
    .from('guests')
    .update(payload)
    .eq('id', guestId)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update guest')
  return data as Guest
}

export async function deleteGuest(guestId: string): Promise<void> {
  const { error } = await supabase.from('guests').delete().eq('id', guestId)
  if (error) throw new Error(error.message)
}

export async function fetchGuestConversations(
  guestId: string
): Promise<Conversation[]> {
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('guest_id', guestId)
    .order('last_message_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!convos?.length) return []

  const convIds = convos.map((c) => c.id)
  const { data: messages } = await supabase
    .from('messages')
    .select('id, conversation_id, content, sender_type, read_at, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  const lastByConvo: Record<string, Conversation['last_message']> = {}
  if (messages) {
    for (const msg of messages) {
      if (!lastByConvo[msg.conversation_id]) {
        lastByConvo[msg.conversation_id] = {
          id: msg.id,
          content: msg.content,
          sender_type: msg.sender_type,
          read_at: msg.read_at,
          created_at: msg.created_at,
        }
      }
    }
  }

  return convos.map((c) => ({
    ...c,
    last_message: lastByConvo[c.id] ?? null,
  })) as Conversation[]
}

export async function findOrCreateWhatsAppConversation(
  hotelId: string,
  guestId: string
): Promise<string> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('guest_id', guestId)
    .eq('channel', 'whatsapp')
    .in('status', ['open', 'in_progress'])
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      hotel_id: hotelId,
      guest_id: guestId,
      channel: 'whatsapp',
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Failed to create conversation')
  return created.id
}

async function triggerBookingConfirmedIfActive(hotelId: string, guest: Guest) {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', hotelId)
    .single()
  if (!hotel) return

  const { data: automation } = await supabase
    .from('automations')
    .select('*')
    .eq('hotel_id', hotelId)
    .eq('trigger', 'booking_confirmed')
    .eq('is_active', true)
    .maybeSingle()

  if (!automation) return

  try {
    await sendAutomationToGuest(automation as Automation, guest, hotel as Hotel)
  } catch (err) {
    console.error('[booking_confirmed automation]', err)
  }
}
