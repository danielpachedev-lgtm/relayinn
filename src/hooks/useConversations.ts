import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useHotelStore } from '../store/hotelStore'
import { useInboxStore } from '../store/inboxStore'
import type { Conversation, ConversationStatus, Message } from '../types'

export type StatusFilter = 'all' | ConversationStatus

export function useConversations() {
  const { currentHotel } = useHotelStore()
  const { setConversations } = useInboxStore()
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchConversations = useCallback(
    async (hotelId: string, status: StatusFilter, query: string) => {
      setLoading(true)

      // 1. Build conversations + guests query
      let convoQuery = supabase
        .from('conversations')
        .select(
          `id, hotel_id, guest_id, channel, status, assigned_to, is_urgent,
           last_message_at, created_at,
           guest:guests(id, name, room_number, check_in, check_out, phone, email, notes)`
        )
        .eq('hotel_id', hotelId)
        .order('last_message_at', { ascending: false })

      if (status !== 'all') {
        convoQuery = convoQuery.eq('status', status)
      }

      if (query.trim()) {
        convoQuery = convoQuery.ilike('guest.name', `%${query.trim()}%`)
      }

      const { data: convos, error } = await convoQuery

      if (error || !convos) {
        setLoading(false)
        return
      }

      // 2. Fetch latest message per conversation
      const convIds = convos.map((c) => c.id)
      let lastMessages: Record<string, Pick<Message, 'id' | 'content' | 'sender_type' | 'read_at' | 'created_at'>> = {}

      if (convIds.length > 0) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, conversation_id, content, sender_type, read_at, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })

        if (messages) {
          for (const msg of messages) {
            if (!lastMessages[msg.conversation_id]) {
              lastMessages[msg.conversation_id] = {
                id: msg.id,
                content: msg.content,
                sender_type: msg.sender_type,
                read_at: msg.read_at,
                created_at: msg.created_at,
              }
            }
          }
        }
      }

      // 3. Merge and apply search filter (client-side for guest name search)
      let results = convos.map((c) => ({
        ...c,
        guest: Array.isArray(c.guest) ? c.guest[0] ?? null : c.guest,
        last_message: lastMessages[c.id] ?? null,
      })) as Conversation[]

      // Client-side guest name filter (Supabase ilike on joined tables can be inconsistent)
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        results = results.filter((c) =>
          c.guest?.name.toLowerCase().includes(q)
        )
      }

      setConversations(results)
      setLoading(false)
    },
    [setConversations]
  )

  // Debounced search trigger
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        if (currentHotel) {
          fetchConversations(currentHotel.id, statusFilter, value)
        }
      }, 300)
    },
    [currentHotel, statusFilter, fetchConversations]
  )

  // Re-fetch when hotel or status changes
  useEffect(() => {
    if (!currentHotel) {
      setLoading(false)
      return
    }
    fetchConversations(currentHotel.id, statusFilter, search)
  }, [currentHotel?.id, statusFilter])

  // Realtime: refresh list when conversations or messages change
  useEffect(() => {
    if (!currentHotel) return

    const channel = supabase
      .channel(`inbox:${currentHotel.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `hotel_id=eq.${currentHotel.id}`,
        },
        () => fetchConversations(currentHotel.id, statusFilter, search)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchConversations(currentHotel.id, statusFilter, search)
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [currentHotel?.id, statusFilter, search, fetchConversations])

  const reload = useCallback(() => {
    if (currentHotel) {
      fetchConversations(currentHotel.id, statusFilter, search)
    }
  }, [currentHotel, statusFilter, search, fetchConversations])

  const setSearchQuery = useCallback(
    (value: string) => {
      setSearch(value)
      if (currentHotel) {
        fetchConversations(currentHotel.id, statusFilter, value)
      }
    },
    [currentHotel, statusFilter, fetchConversations]
  )

  return {
    loading,
    statusFilter,
    setStatusFilter,
    search,
    handleSearchChange,
    setSearchQuery,
    reload,
  }
}
