import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface MetaEnv {
  appId: string
  phoneNumberId: string
  wabaId: string
  accessToken: string
  verifyToken: string
  appSecret: string | null
}

export function requireMetaEnv(): MetaEnv {
  const appId = Deno.env.get('META_APP_ID')
  const phoneNumberId = Deno.env.get('META_PHONE_NUMBER_ID')
  const wabaId = Deno.env.get('META_WHATSAPP_BUSINESS_ACCOUNT_ID')
  const accessToken = Deno.env.get('META_ACCESS_TOKEN')
  const verifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')

  if (!appId || !phoneNumberId || !wabaId || !accessToken || !verifyToken) {
    throw new Error('Meta WhatsApp secrets not configured')
  }

  return {
    appId,
    phoneNumberId,
    wabaId,
    accessToken,
    verifyToken,
    appSecret: Deno.env.get('META_APP_SECRET') ?? null,
  }
}

/** Meta API expects digits only, no + prefix */
export function cleanPhoneForMeta(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

/** Store guest phones with + prefix for consistency with the rest of the app */
export function phoneFromMetaWaId(waId: string): string {
  const digits = cleanPhoneForMeta(waId)
  return digits ? `+${digits}` : ''
}

export function messageContentFromMeta(message: {
  type?: string
  text?: { body?: string }
}): string {
  switch (message.type) {
    case 'text':
      return message.text?.body?.trim() || ''
    case 'image':
      return '[Image received]'
    case 'audio':
      return '[Audio received]'
    case 'video':
      return '[Video received]'
    case 'document':
      return '[Document received]'
    case 'sticker':
      return '[Sticker received]'
    case 'location':
      return '[Location received]'
    default:
      return `[${message.type ?? 'message'} received]`
  }
}

export async function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | null
): Promise<boolean> {
  if (!appSecret) return true
  if (!signatureHeader?.startsWith('sha256=')) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const expected =
    'sha256=' +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

  return timingSafeEqual(signatureHeader, expected)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export async function sendMetaWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  body: string
): Promise<{ messageId?: string }> {
  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhoneForMeta(to),
      type: 'text',
      text: { body },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? 'Meta API request failed') as Error & {
      status?: number
    }
    err.status = res.status
    throw err
  }

  return { messageId: data?.messages?.[0]?.id as string | undefined }
}

export async function findHotelForIncomingMessage(
  supabase: SupabaseClient,
  phoneNumberIdFromPayload?: string | null
): Promise<string | null> {
  const metaPhoneId = phoneNumberIdFromPayload ?? Deno.env.get('META_PHONE_NUMBER_ID')

  if (metaPhoneId) {
    const { data } = await supabase
      .from('hotels')
      .select('id')
      .eq('whatsapp_phone_number_id', metaPhoneId)
      .eq('whatsapp_connected', true)
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id
  }

  const { data: fallback } = await supabase
    .from('hotels')
    .select('id')
    .eq('whatsapp_connected', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return fallback?.id ?? null
}

export async function findOrCreateGuest(
  supabase: SupabaseClient,
  hotelId: string,
  waPhone: string,
  profileName?: string | null
) {
  const storedPhone = phoneFromMetaWaId(waPhone)
  const digits = cleanPhoneForMeta(waPhone)

  const { data: existing } = await supabase
    .from('guests')
    .select('id, hotel_id, name, phone')
    .eq('hotel_id', hotelId)
    .ilike('phone', `%${digits}%`)
    .limit(1)
    .maybeSingle()

  if (existing) return existing

  const { data: created, error } = await supabase
    .from('guests')
    .insert({
      hotel_id: hotelId,
      name: profileName?.trim() || storedPhone,
      phone: storedPhone,
    })
    .select('id, hotel_id, name, phone')
    .single()

  if (error || !created) throw error ?? new Error('Failed to create guest')
  return created
}

export async function findOrCreateWhatsAppConversation(
  supabase: SupabaseClient,
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

  if (existing?.id) return existing.id

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

  if (error || !created) throw error ?? new Error('Failed to create conversation')
  return created.id
}
