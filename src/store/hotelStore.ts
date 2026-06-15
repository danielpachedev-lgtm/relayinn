import { create } from 'zustand'
import type { Hotel, Staff } from '../types'
import {
  canAddStaff as checkCanAddStaff,
  canStartConversation as checkCanStartConversation,
} from '../lib/planLimits'

interface HotelStore {
  currentHotel: Hotel | null
  currentStaff: Staff | null
  staffCount: number
  monthlyConversations: number
  setHotel: (hotel: Hotel | null) => void
  setStaff: (staff: Staff | null) => void
  setUsageStats: (staffCount: number, monthlyConversations: number) => void
  reset: () => void
}

export const useHotelStore = create<HotelStore>((set) => ({
  currentHotel: null,
  currentStaff: null,
  staffCount: 0,
  monthlyConversations: 0,
  setHotel: (hotel) => set({ currentHotel: hotel }),
  setStaff: (staff) => set({ currentStaff: staff }),
  setUsageStats: (staffCount, monthlyConversations) => set({ staffCount, monthlyConversations }),
  reset: () =>
    set({
      currentHotel: null,
      currentStaff: null,
      staffCount: 0,
      monthlyConversations: 0,
    }),
}))

export function usePlanEnforcement() {
  const { currentHotel, staffCount, monthlyConversations } = useHotelStore()
  return {
    canAddStaff: checkCanAddStaff(currentHotel, staffCount),
    canStartConversation: checkCanStartConversation(currentHotel, monthlyConversations),
    staffCount,
    monthlyConversations,
  }
}
