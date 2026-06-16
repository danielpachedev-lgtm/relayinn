import { authenticateHotel, corsHeaders, jsonResponse } from '../_shared/stripe-helpers.ts'

function cleanPhoneForMeta(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    console.log('[send-meta-whatsapp] Function started')

    const auth = await authenticateHotel(req)
    if (!auth) {
      console.log('[send-meta-whatsapp] Auth failed')
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401)
    }
    console.log('[send-meta-whatsapp] JWT verified, userId:', auth.user.id)

    const { admin } = auth
    const { conversationId, message, staffId } = await req.json()

    if (!conversationId || !message?.trim() || !staffId) {
      return jsonResponse({ success: false, error: 'Missing required fields' }, 400)
    }

    const { data: staff } = await admin
      .from('staff')
      .select('id, hotel_id')
      .eq('id', staffId)
      .eq('user_id', auth.user.id)
      .single()

    if (!staff) {
      return jsonResponse({ success: false, error: 'Forbidden' }, 403)
    }

    const { data: hotelCreds } = await admin
      .from('hotels')
      .select('meta_access_token, whatsapp_phone_number_id')
      .eq('id', staff.hotel_id)
      .single()

    const accessToken =
      hotelCreds?.meta_access_token ?? Deno.env.get('META_ACCESS_TOKEN') ?? null
    const phoneNumberId =
      hotelCreds?.whatsapp_phone_number_id ?? Deno.env.get('META_PHONE_NUMBER_ID') ?? null

    console.log('[send-meta-whatsapp] Using hotel token:', !!hotelCreds?.meta_access_token)

    if (!accessToken || !phoneNumberId) {
      return jsonResponse({ success: false, error: 'WhatsApp not configured for this hotel' }, 500)
    }

    const { data: conversation, error: convoErr } = await admin
      .from('conversations')
      .select('id, hotel_id, guest_id, channel, guest:guests(id, phone)')
      .eq('id', conversationId)
      .eq('hotel_id', staff.hotel_id)
      .single()

    if (convoErr || !conversation) {
      console.log('[send-meta-whatsapp] Conversation fetch failed:', convoErr?.message)
      return jsonResponse({ success: false, error: 'Conversation not found' }, 404)
    }
    console.log('[send-meta-whatsapp] Conversation fetched:', conversation.id)

    if (conversation.channel !== 'whatsapp') {
      return jsonResponse({ success: false, error: 'Not a WhatsApp conversation' }, 400)
    }

    const guest = Array.isArray(conversation.guest) ? conversation.guest[0] : conversation.guest
    const guestPhone = guest?.phone ?? ''
    console.log('[send-meta-whatsapp] Guest phone:', guestPhone)

    const cleanPhone = cleanPhoneForMeta(guestPhone)
    if (!cleanPhone || cleanPhone.length < 8) {
      return jsonResponse({ success: false, error: 'Guest has no valid phone number' }, 400)
    }

    const trimmedMessage = message.trim()
    const metaRequestBody = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body: trimmedMessage },
    }

    console.log('[send-meta-whatsapp] Meta API request body:', JSON.stringify(metaRequestBody))

    const metaRes = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaRequestBody),
      signal: AbortSignal.timeout(25_000),
    })

    const metaResponseText = await metaRes.text()
    console.log('[send-meta-whatsapp] Meta API response status:', metaRes.status)
    console.log('[send-meta-whatsapp] Meta API response body:', metaResponseText)

    let metaData: { messages?: { id: string }[]; error?: { message?: string } }
    try {
      metaData = JSON.parse(metaResponseText)
    } catch {
      return jsonResponse({ success: false, error: 'Invalid response from Meta API' }, 502)
    }

    if (!metaRes.ok) {
      const errorMessage = metaData?.error?.message ?? 'Meta API request failed'
      if (metaRes.status === 429) {
        return jsonResponse({ success: false, error: 'Too many messages. Please wait and try again.' }, 429)
      }
      return jsonResponse({ success: false, error: errorMessage }, 502)
    }

    const messageId = metaData?.messages?.[0]?.id
    const now = new Date().toISOString()

    const { error: msgErr } = await admin.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'staff',
      sender_id: staffId,
      content: trimmedMessage,
      is_internal_note: false,
    })

    if (msgErr) {
      console.error('[send-meta-whatsapp] DB insert failed:', msgErr)
      return jsonResponse({ success: false, error: 'Message sent but failed to save' }, 500)
    }

    await admin
      .from('conversations')
      .update({ last_message_at: now, status: 'in_progress' })
      .eq('id', conversationId)

    console.log('[send-meta-whatsapp] Function completed successfully')
    return jsonResponse({ success: true, messageId })
  } catch (err) {
    console.error('[send-meta-whatsapp] Unhandled error:', err)
    const message =
      err instanceof DOMException && err.name === 'TimeoutError'
        ? 'Meta API timed out. Please try again.'
        : err instanceof Error
          ? err.message
          : 'Unknown error'
    return jsonResponse({ success: false, error: message }, 500)
  }
})
