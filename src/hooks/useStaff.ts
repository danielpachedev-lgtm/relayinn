import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useHotelStore } from '../store/hotelStore'
import type { Staff } from '../types'

export function useStaff() {
  const { currentHotel } = useHotelStore()
  const [staff, setStaff] = useState<Staff[]>([])

  useEffect(() => {
    if (!currentHotel) return
    supabase
      .from('staff')
      .select('*')
      .eq('hotel_id', currentHotel.id)
      .then(({ data }) => {
        if (data) setStaff(data as Staff[])
      })
  }, [currentHotel?.id])

  return { staff }
}
