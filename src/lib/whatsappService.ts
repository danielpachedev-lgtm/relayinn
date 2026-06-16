import { FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface SendWhatsAppResult {
  success: boolean
  messageId?: string
  error?: string
  status?: number
}

async function parseFunctionError(error: unknown): Promise<SendWhatsAppResult> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json()
      return {
        success: false,
        error: body?.error ?? error.message,
        status: error.context.status,
      }
    } catch {
      return { success: false, error: error.message, status: error.context.status }
    }
  }

  if (error instanceof FunctionsRelayError) {
    return { success: false, error: error.message }
  }

  if (error instanceof Error) {
    return { success: false, error: error.message }
  }

  return { success: false, error: 'Failed to send message' }
}

export async function sendWhatsAppMessage(
  conversationId: string,
  message: string,
  staffId: string
): Promise<SendWhatsAppResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return { success: false, error: 'Session expired. Please log in again.' }
  }

  const { data, error } = await supabase.functions.invoke('send-meta-whatsapp', {
    body: { conversationId, message, staffId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error) {
    return parseFunctionError(error)
  }

  if (data?.success === false) {
    return {
      success: false,
      error: data.error ?? 'Failed to send message',
      status: data.status,
    }
  }

  return { success: true, messageId: data?.messageId }
}

export async function ensureTestConversation(
  hotelId: string,
  phone: string
): Promise<string> {
  const normalized = phone.trim()

  let { data: guest } = await supabase
    .from('guests')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('phone', normalized)
    .maybeSingle()

  if (!guest) {
    const { data: created, error } = await supabase
      .from('guests')
      .insert({ hotel_id: hotelId, name: 'Test Contact', phone: normalized })
      .select('id')
      .single()
    if (error || !created) throw new Error(error?.message ?? 'Failed to create test guest')
    guest = created
  }

  let { data: convo } = await supabase
    .from('conversations')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('guest_id', guest.id)
    .eq('channel', 'whatsapp')
    .in('status', ['open', 'in_progress'])
    .maybeSingle()

  if (!convo) {
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        hotel_id: hotelId,
        guest_id: guest.id,
        channel: 'whatsapp',
        status: 'open',
      })
      .select('id')
      .single()
    if (error || !created) throw new Error(error?.message ?? 'Failed to create test conversation')
    convo = created
  }

  return convo.id
}
