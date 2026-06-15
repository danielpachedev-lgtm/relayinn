import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  guestMatchesTrigger,
  pickChannel,
  renderMessage,
  type AutomationRow,
  type GuestRow,
  type HotelRow,
} from './engine.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: automations, error: autoErr } = await supabase
      .from('automations')
      .select('*')
      .eq('is_active', true)

    if (autoErr) throw autoErr

    const results: { sent: number; skipped: number; errors: string[] } = {
      sent: 0,
      skipped: 0,
      errors: [],
    }

    for (const automation of (automations ?? []) as AutomationRow[]) {
      const { data: hotel } = await supabase
        .from('hotels')
        .select('id, name')
        .eq('id', automation.hotel_id)
        .single()

      if (!hotel) continue

      const { data: guests } = await supabase
        .from('guests')
        .select('*')
        .eq('hotel_id', automation.hotel_id)

      for (const guest of (guests ?? []) as GuestRow[]) {
        if (!guestMatchesTrigger(guest, automation.trigger)) continue

        // Deduplication: skip if sent in last 24h
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: recent } = await supabase
          .from('automation_logs')
          .select('id')
          .eq('automation_id', automation.id)
          .eq('guest_id', guest.id)
          .gte('sent_at', since)
          .limit(1)
          .maybeSingle()

        if (recent) {
          results.skipped++
          continue
        }

        // booking_confirmed: also skip if any log ever exists for this guest+automation
        if (automation.trigger === 'booking_confirmed') {
          const { data: ever } = await supabase
            .from('automation_logs')
            .select('id')
            .eq('automation_id', automation.id)
            .eq('guest_id', guest.id)
            .limit(1)
            .maybeSingle()
          if (ever) {
            results.skipped++
            continue
          }
        }

        try {
          await sendToGuest(supabase, automation, guest, hotel as HotelRow)
          results.sent++
        } catch (e) {
          results.errors.push(
            `${automation.trigger}/${guest.id}: ${e instanceof Error ? e.message : String(e)}`
          )
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendToGuest(
  supabase: ReturnType<typeof createClient>,
  automation: AutomationRow,
  guest: GuestRow,
  hotel: HotelRow
) {
  const rendered = renderMessage(automation.message_template, guest, hotel)
  const channel = pickChannel(guest)
  const now = new Date().toISOString()

  let conversationId: string | null = null

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('guest_id', guest.id)
    .eq('channel', channel)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    conversationId = existing.id
  } else {
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        hotel_id: hotel.id,
        guest_id: guest.id,
        channel,
        status: 'open',
      })
      .select('id')
      .single()
    if (error || !created) throw new Error(error?.message ?? 'conversation create failed')
    conversationId = created.id
  }

  const { error: msgErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'system',
    sender_id: null,
    content: rendered,
    is_internal_note: false,
  })
  if (msgErr) throw msgErr

  await supabase
    .from('conversations')
    .update({ last_message_at: now })
    .eq('id', conversationId)

  await supabase.from('automation_logs').insert({
    hotel_id: hotel.id,
    automation_id: automation.id,
    guest_id: guest.id,
    trigger: automation.trigger,
    message_sent: rendered,
    sent_at: now,
  })

  await supabase
    .from('automations')
    .update({ last_sent_at: now })
    .eq('id', automation.id)
}
