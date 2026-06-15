import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizePhone } from '../_shared/phone.ts'
import {
  TWIML_EMPTY_RESPONSE,
  twimlHeaders,
} from '../_shared/twilio.ts'

function parseFormBody(body: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const [key, value] of new URLSearchParams(body)) {
    params[key] = value
  }
  return params
}

async function findGuestByPhone(supabase: ReturnType<typeof createClient>, phone: string) {
  const normalized = normalizePhone(phone)

  const { data: exact } = await supabase
    .from('guests')
    .select('id, hotel_id, name, phone')
    .eq('phone', normalized)
    .limit(1)
    .maybeSingle()

  if (exact) return exact

  // Fallback: match without + prefix variants
  const { data: guests } = await supabase.from('guests').select('id, hotel_id, name, phone').not('phone', 'is', null)

  if (guests) {
    const match = guests.find((g) => g.phone && normalizePhone(g.phone) === normalized)
    if (match) return match
  }

  // Fallback: guest linked to an open WhatsApp conversation with matching phone
  const { data: convos } = await supabase
    .from('conversations')
    .select('guest_id, hotel_id, guest:guests(id, hotel_id, name, phone)')
    .eq('channel', 'whatsapp')
    .in('status', ['open', 'in_progress'])

  if (convos) {
    for (const convo of convos) {
      const guest = Array.isArray(convo.guest) ? convo.guest[0] : convo.guest
      if (guest?.phone && normalizePhone(guest.phone) === normalized) {
        return guest
      }
    }
  }

  return null
}

async function getFallbackHotelId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data } = await supabase
    .from('hotels')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const rawBody = await req.text()
    const params = parseFormBody(rawBody)

    // TODO: Re-enable Twilio signature validation before production
    // const { authToken } = getTwilioEnv()
    // const signature = req.headers.get('X-Twilio-Signature')
    // const url = new URL(req.url)
    // const webhookUrl = `${url.origin}${url.pathname}`
    // const valid = await validateTwilioSignature(authToken, signature, webhookUrl, params)
    // if (!valid) return new Response('Forbidden', { status: 403 })

    const fromRaw = params.From ?? ''
    const body = params.Body ?? ''
    const guestPhone = normalizePhone(fromRaw)

    if (!guestPhone || !body) {
      return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let guest = await findGuestByPhone(supabase, guestPhone)
    let hotelId: string

    if (guest) {
      hotelId = guest.hotel_id
    } else {
      const fallbackHotelId = await getFallbackHotelId(supabase)
      if (!fallbackHotelId) {
        console.error('[whatsapp-webhook] No hotel found for new guest')
        return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
      }
      hotelId = fallbackHotelId

      const { data: newGuest, error: guestErr } = await supabase
        .from('guests')
        .insert({ hotel_id: hotelId, name: 'Unknown Guest', phone: guestPhone })
        .select('id, hotel_id, name, phone')
        .single()

      if (guestErr || !newGuest) {
        console.error('[whatsapp-webhook] Failed to create guest:', guestErr)
        return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
      }
      guest = newGuest
    }

    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id')
      .eq('guest_id', guest.id)
      .eq('channel', 'whatsapp')
      .in('status', ['open', 'in_progress'])
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let conversationId = existingConvo?.id

    if (!conversationId) {
      const { data: newConvo, error: convoErr } = await supabase
        .from('conversations')
        .insert({
          hotel_id: hotelId,
          guest_id: guest.id,
          channel: 'whatsapp',
          status: 'open',
        })
        .select('id')
        .single()

      if (convoErr || !newConvo) {
        console.error('[whatsapp-webhook] Failed to create conversation:', convoErr)
        return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
      }
      conversationId = newConvo.id
    }

    const now = new Date().toISOString()

    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'guest',
      content: body,
      read_at: null,
    })

    if (msgErr) {
      console.error('[whatsapp-webhook] Failed to insert message:', msgErr)
      return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
    }

    await supabase
      .from('conversations')
      .update({ last_message_at: now })
      .eq('id', conversationId)

    return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
  } catch (err) {
    console.error('[whatsapp-webhook] Error:', err)
    return new Response(TWIML_EMPTY_RESPONSE, { headers: twimlHeaders })
  }
})
