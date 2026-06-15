import { useState, useEffect, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useHotelStore } from '../store/hotelStore'
import type { GuestWithMeta } from '../types'

export function useGuests() {
  const { currentHotel } = useHotelStore()
  const [guests, setGuests] = useState<GuestWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchGuests = useCallback(async (hotelId: string) => {
    setLoading(true)

    const { data, error } = await supabase
      .from('guests')
      .select('*, conversations(count)')
      .eq('hotel_id', hotelId)
      .order('check_in', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('[useGuests]', error)
      setLoading(false)
      return
    }

    const mapped: GuestWithMeta[] = (data ?? []).map((row) => {
      const convCount = Array.isArray(row.conversations)
        ? (row.conversations[0]?.count ?? 0)
        : 0
      const { conversations: _, ...guest } = row
      return { ...guest, conversation_count: convCount } as GuestWithMeta
    })

    setGuests(mapped)
    setLoading(false)
  }, [])

  const reload = useCallback(() => {
    if (currentHotel) fetchGuests(currentHotel.id)
  }, [currentHotel, fetchGuests])

  useEffect(() => {
    if (!currentHotel) {
      setLoading(false)
      return
    }

    fetchGuests(currentHotel.id)

    if (channelRef.current) channelRef.current.unsubscribe()

    const channel = supabase
      .channel(`guests:${currentHotel.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `hotel_id=eq.${currentHotel.id}`,
        },
        () => fetchGuests(currentHotel.id)
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [currentHotel?.id, fetchGuests])

  return { guests, loading, reload, setGuests }
}
