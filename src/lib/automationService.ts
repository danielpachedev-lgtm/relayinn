import { supabase } from './supabase'
import { AUTOMATION_DEFINITIONS } from './automationDefaults'
import { renderAutomationMessage } from './automationUtils'
import type { Automation, AutomationLog, Guest, Hotel } from '../types'

export async function fetchAutomations(hotelId: string): Promise<Automation[]> {
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Automation[]
}

export async function seedDefaultAutomations(hotelId: string): Promise<Automation[]> {
  const rows = AUTOMATION_DEFINITIONS.map((def) => ({
    hotel_id: hotelId,
    name: def.name,
    trigger: def.trigger,
    message_template: def.defaultTemplate,
    is_active: false,
  }))

  const { data, error } = await supabase.from('automations').insert(rows).select()
  if (error) throw new Error(error.message)
  return (data ?? []) as Automation[]
}

export async function ensureAutomations(hotelId: string): Promise<Automation[]> {
  const existing = await fetchAutomations(hotelId)
  if (existing.length >= AUTOMATION_DEFINITIONS.length) return existing

  const existingTriggers = new Set(existing.map((a) => a.trigger))
  const missing = AUTOMATION_DEFINITIONS.filter((d) => !existingTriggers.has(d.trigger))

  if (missing.length > 0) {
    const { error } = await supabase.from('automations').insert(
      missing.map((def) => ({
        hotel_id: hotelId,
        name: def.name,
        trigger: def.trigger,
        message_template: def.defaultTemplate,
        is_active: false,
      }))
    )
    if (error) throw new Error(error.message)
  }

  return fetchAutomations(hotelId)
}

export async function updateAutomation(
  id: string,
  updates: Partial<Pick<Automation, 'is_active' | 'message_template' | 'last_sent_at'>>
): Promise<Automation> {
  const { data, error } = await supabase
    .from('automations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Update failed')
  return data as Automation
}

export async function findOrCreateGuestConversation(
  hotelId: string,
  guest: Guest
): Promise<string> {
  const channel = guest.phone ? 'whatsapp' : guest.email ? 'email' : 'web'

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('guest_id', guest.id)
    .eq('channel', channel)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      hotel_id: hotelId,
      guest_id: guest.id,
      channel,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Failed to create conversation')
  return created.id
}

export async function sendAutomationToGuest(
  automation: Automation,
  guest: Guest,
  hotel: Hotel,
  options?: { skipDedup?: boolean }
): Promise<{ message: string; conversationId: string }> {
  if (!options?.skipDedup) {
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
      throw new Error('A message was already sent to this guest in the last 24 hours')
    }
  }

  const rendered = renderAutomationMessage(automation.message_template, guest, hotel)
  const conversationId = await findOrCreateGuestConversation(hotel.id, guest)
  const now = new Date().toISOString()

  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'system',
    sender_id: null,
    content: rendered,
    is_internal_note: false,
  })

  if (msgError) throw new Error(msgError.message)

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

  await updateAutomation(automation.id, { last_sent_at: now })

  return { message: rendered, conversationId }
}

export interface AutomationLogWithMeta extends AutomationLog {
  guest?: Pick<Guest, 'id' | 'name'>
  automation?: Pick<Automation, 'id' | 'name' | 'trigger'>
}

export async function fetchAutomationLogs(
  hotelId: string,
  limit = 20
): Promise<AutomationLogWithMeta[]> {
  const { data, error } = await supabase
    .from('automation_logs')
    .select('*, guest:guests(id, name), automation:automations(id, name, trigger)')
    .eq('hotel_id', hotelId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    ...row,
    guest: Array.isArray(row.guest) ? row.guest[0] : row.guest,
    automation: Array.isArray(row.automation) ? row.automation[0] : row.automation,
  })) as AutomationLogWithMeta[]
}
