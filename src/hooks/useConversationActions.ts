import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useInboxStore } from '../store/inboxStore'
import type { ConversationStatus } from '../types'

const STATUS_CYCLE: Record<ConversationStatus, ConversationStatus> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'open',
}

export function useConversationActions(conversationId: string | null) {
  const { updateConversation, activeConversation } = useInboxStore()

  const updateField = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!conversationId) return
      await supabase.from('conversations').update(updates).eq('id', conversationId)
      updateConversation(conversationId, updates as never)
    },
    [conversationId, updateConversation]
  )

  const cycleStatus = useCallback(async () => {
    if (!activeConversation) return
    const next = STATUS_CYCLE[activeConversation.status]
    await updateField({ status: next })
  }, [activeConversation, updateField])

  const setStatus = useCallback(
    async (status: ConversationStatus) => {
      await updateField({ status })
    },
    [updateField]
  )

  const assignTo = useCallback(
    async (staffId: string | null, staffName?: string) => {
      await updateField({ assigned_to: staffId })
      if (staffName) toast.success(`Assigned to ${staffName}`)
      else toast.success('Unassigned')
    },
    [updateField]
  )

  const toggleUrgent = useCallback(async () => {
    if (!activeConversation) return
    const next = !activeConversation.is_urgent
    await updateField({ is_urgent: next })
    if (next) toast.success('Marked as urgent')
  }, [activeConversation, updateField])

  const resolve = useCallback(async () => {
    await updateField({ status: 'resolved' })
    toast.success('Conversation resolved')
  }, [updateField])

  return { cycleStatus, setStatus, assignTo, toggleUrgent, resolve }
}
