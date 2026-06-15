import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isValidE164, normalizePhone, toWhatsAppAddress } from '../_shared/phone.ts'
import { requireTwilioEnv, sendTwilioWhatsApp } from '../_shared/twilio.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401)
    }

    const { conversationId, message, staffId } = await req.json()

    if (!conversationId || !message?.trim() || !staffId) {
      return jsonResponse({ success: false, error: 'Missing required fields' }, 400)
    }

    let twilioEnv
    try {
      twilioEnv = requireTwilioEnv()
    } catch {
      console.error('[send-whatsapp] Twilio credentials missing')
      return jsonResponse({ success: false, error: 'Messaging service not configured' }, 500)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: staff } = await admin
      .from('staff')
      .select('id, hotel_id')
      .eq('id', staffId)
      .eq('user_id', user.id)
      .single()

    if (!staff) {
      return jsonResponse({ success: false, error: 'Forbidden' }, 403)
    }

    const { data: conversation, error: convoErr } = await admin
      .from('conversations')
      .select('id, hotel_id, guest_id, channel, guest:guests(id, phone)')
      .eq('id', conversationId)
      .eq('hotel_id', staff.hotel_id)
      .single()

    if (convoErr || !conversation) {
      return jsonResponse({ success: false, error: 'Conversation not found' }, 404)
    }

    const guest = Array.isArray(conversation.guest) ? conversation.guest[0] : conversation.guest
    const guestPhone = guest?.phone ? normalizePhone(guest.phone) : ''

    if (!guestPhone) {
      return jsonResponse({ success: false, error: 'Guest has no phone number' }, 400)
    }

    if (!isValidE164(guestPhone)) {
      return jsonResponse({ success: false, error: 'Invalid phone format. Must start with +' }, 400)
    }

    const from = toWhatsAppAddress(twilioEnv.whatsappNumber)
    const to = toWhatsAppAddress(guestPhone)
    const trimmedMessage = message.trim()

    let messageSid: string
    try {
      const result = await sendTwilioWhatsApp(
        twilioEnv.accountSid,
        twilioEnv.authToken,
        from,
        to,
        trimmedMessage
      )
      messageSid = result.sid
    } catch (err) {
      const status = (err as Error & { status?: number }).status
      const errorMessage = err instanceof Error ? err.message : 'Twilio send failed'
      console.error('[send-whatsapp] Twilio error:', errorMessage)

      if (status === 429) {
        return jsonResponse({ success: false, error: 'Too many messages. Please wait and try again.' }, 429)
      }
      return jsonResponse({ success: false, error: errorMessage }, 502)
    }

    const now = new Date().toISOString()

    const { error: msgErr } = await admin.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'staff',
      sender_id: staffId,
      content: trimmedMessage,
      is_internal_note: false,
    })

    if (msgErr) {
      console.error('[send-whatsapp] Message saved to Twilio but DB insert failed:', msgErr)
      return jsonResponse({ success: false, error: 'Message sent but failed to save' }, 500)
    }

    await admin
      .from('conversations')
      .update({ last_message_at: now, status: 'in_progress' })
      .eq('id', conversationId)

    return jsonResponse({ success: true, messageSid })
  } catch (err) {
    console.error('[send-whatsapp] Error:', err)
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      500
    )
  }
})
