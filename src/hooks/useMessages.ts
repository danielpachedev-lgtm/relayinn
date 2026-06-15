import { useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useInboxStore } from '../store/inboxStore'
import { sendWhatsAppMessage } from '../lib/whatsappService'
import type { ConversationChannel, Message } from '../types'

export function useMessages(conversationId: string | null) {
  const { messages, setMessages, appendMessage, updateConversation, activeConversation } =
    useInboxStore()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const threadMessages = conversationId ? (messages[conversationId] ?? null) : null

  const scrollToBottom = useCallback((smooth = false) => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        })
      }
    }, 50)
  }, [])

  const markAsRead = useCallback(
    async (convId: string) => {
      const now = new Date().toISOString()
      await supabase
        .from('messages')
        .update({ read_at: now })
        .eq('conversation_id', convId)
        .eq('sender_type', 'guest')
        .is('read_at', null)

      updateConversation(convId, {
        last_message:
          activeConversation?.last_message?.sender_type === 'guest' &&
          !activeConversation.last_message.read_at
            ? { ...activeConversation.last_message, read_at: now }
            : activeConversation?.last_message,
      })
    },
    [activeConversation, updateConversation]
  )

  const fetchMessages = useCallback(
    async (convId: string) => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(convId, data as Message[])
        markAsRead(convId)
        scrollToBottom()
      }
    },
    [setMessages, markAsRead, scrollToBottom]
  )

  useEffect(() => {
    if (!conversationId) return

    // Always refetch so automations/tests/messages added elsewhere appear
    fetchMessages(conversationId)

    // Real-time subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          appendMessage(conversationId, payload.new as Message)
          scrollToBottom(true)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (
      content: string,
      isInternalNote: boolean,
      staffId: string,
      channel: ConversationChannel = 'web'
    ): Promise<{ ok: boolean; error?: string; status?: number }> => {
      if (!conversationId || !content.trim()) return { ok: false }

      if (isInternalNote || channel !== 'whatsapp') {
        const { data: newMsg, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_type: 'staff',
            sender_id: staffId,
            content: content.trim(),
            is_internal_note: isInternalNote,
          })
          .select()
          .single()

        if (error || !newMsg) return { ok: false, error: error?.message }

        appendMessage(conversationId, newMsg as Message)

        if (!isInternalNote) {
          const now = new Date().toISOString()
          await supabase
            .from('conversations')
            .update({ last_message_at: now, status: 'in_progress' })
            .eq('id', conversationId)

          updateConversation(conversationId, {
            last_message_at: now,
            status: 'in_progress',
            last_message: {
              id: newMsg.id,
              content: newMsg.content,
              sender_type: 'staff',
              read_at: null,
              created_at: newMsg.created_at,
            },
          })
        }

        scrollToBottom(true)
        return { ok: true }
      }

      const result = await sendWhatsAppMessage(conversationId, content.trim(), staffId)
      if (!result.success) {
        return { ok: false, error: result.error, status: result.status }
      }

      return { ok: true }
    },
    [conversationId, appendMessage, updateConversation, scrollToBottom]
  )

  return { messages: threadMessages, scrollRef, sendMessage }
}
