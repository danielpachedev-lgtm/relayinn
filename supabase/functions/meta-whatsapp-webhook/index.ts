import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  findHotelForIncomingMessage,
  findOrCreateGuest,
  findOrCreateWhatsAppConversation,
  messageContentFromMeta,
  requireMetaEnv,
  verifyMetaWebhookSignature,
} from '../_shared/meta-whatsapp.ts'

Deno.serve(async (req) => {
  const url = new URL(req.url)

  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    let verifyToken: string
    try {
      verifyToken = requireMetaEnv().verifyToken
    } catch {
      return new Response('Server misconfigured', { status: 500 })
    }

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const meta = requireMetaEnv()
    const rawBody = await req.text()

    const valid = await verifyMetaWebhookSignature(
      rawBody,
      req.headers.get('x-hub-signature-256'),
      meta.appSecret
    )
    if (!valid) {
      console.error('[meta-whatsapp-webhook] Invalid signature')
      return new Response('Forbidden', { status: 403 })
    }

    const body = JSON.parse(rawBody)
    const entry = body.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    if (!value?.messages?.length) {
      return new Response('OK', { status: 200 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const phoneNumberId = value.metadata?.phone_number_id as string | undefined
    const hotelId = await findHotelForIncomingMessage(supabase, phoneNumberId)

    if (!hotelId) {
      console.error('[meta-whatsapp-webhook] No connected hotel found')
      return new Response('OK', { status: 200 })
    }

    const profileName = value.contacts?.[0]?.profile?.name as string | undefined

    for (const message of value.messages) {
      const waPhone = message.from as string
      const content = messageContentFromMeta(message)
      if (!waPhone || !content) continue

      try {
        const guest = await findOrCreateGuest(supabase, hotelId, waPhone, profileName)
        const conversationId = await findOrCreateWhatsAppConversation(
          supabase,
          hotelId,
          guest.id
        )
        const now = new Date().toISOString()

        const { error: msgErr } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'guest',
          content,
          read_at: null,
        })

        if (msgErr) {
          console.error('[meta-whatsapp-webhook] Insert message failed:', msgErr)
          continue
        }

        await supabase
          .from('conversations')
          .update({ last_message_at: now })
          .eq('id', conversationId)
      } catch (err) {
        console.error('[meta-whatsapp-webhook] Message handling error:', err)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('[meta-whatsapp-webhook] Error:', err)
    return new Response('OK', { status: 200 })
  }
})
