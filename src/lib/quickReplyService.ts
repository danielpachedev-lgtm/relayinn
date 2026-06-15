import { supabase } from './supabase'
import { DEFAULT_QUICK_REPLIES } from './settingsConstants'
import type { QuickReply } from '../types'

export async function fetchQuickReplies(hotelId: string): Promise<QuickReply[]> {
  const { data, error } = await supabase
    .from('quick_replies')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as QuickReply[]
}

export async function ensureQuickReplies(hotelId: string): Promise<QuickReply[]> {
  const existing = await fetchQuickReplies(hotelId)
  if (existing.length > 0) return existing

  const { data, error } = await supabase
    .from('quick_replies')
    .insert(
      DEFAULT_QUICK_REPLIES.map((r) => ({
        hotel_id: hotelId,
        name: r.name,
        message: r.message,
        sort_order: r.sort_order,
      }))
    )
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []) as QuickReply[]
}

export async function createQuickReply(
  hotelId: string,
  name: string,
  message: string,
  sortOrder: number
): Promise<QuickReply> {
  const { data, error } = await supabase
    .from('quick_replies')
    .insert({ hotel_id: hotelId, name, message, sort_order: sortOrder })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create')
  return data as QuickReply
}

export async function updateQuickReply(
  id: string,
  updates: Partial<Pick<QuickReply, 'name' | 'message' | 'sort_order'>>
): Promise<QuickReply> {
  const { data, error } = await supabase
    .from('quick_replies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to update')
  return data as QuickReply
}

export async function deleteQuickReply(id: string): Promise<void> {
  const { error } = await supabase.from('quick_replies').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function swapQuickReplyOrder(
  a: QuickReply,
  b: QuickReply
): Promise<void> {
  await Promise.all([
    updateQuickReply(a.id, { sort_order: b.sort_order }),
    updateQuickReply(b.id, { sort_order: a.sort_order }),
  ])
}
