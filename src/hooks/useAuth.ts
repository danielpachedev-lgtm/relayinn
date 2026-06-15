import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useHotelStore } from '../store/hotelStore'

export async function loadHotelData(userId: string) {
  // Step 1: get staff record for this user
  const { data: staffData, error: staffErr } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (staffErr || !staffData) {
    console.error('[loadHotelData] staff query failed:', staffErr)
    return null
  }

  // Step 2: get the hotel separately
  const { data: hotelData, error: hotelErr } = await supabase
    .from('hotels')
    .select('*')
    .eq('id', staffData.hotel_id)
    .single()

  if (hotelErr || !hotelData) {
    console.error('[loadHotelData] hotel query failed:', hotelErr)
    return null
  }

  return { staff: staffData, hotel: hotelData }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setHotel, setStaff, reset } = useHotelStore()

  async function hydrateStore(userId: string) {
    const result = await loadHotelData(userId)
    if (result) {
      setStaff(result.staff)
      setHotel(result.hotel)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        hydrateStore(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        hydrateStore(session.user.id)
      } else {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    reset()
  }

  return { user, loading, signOut }
}
