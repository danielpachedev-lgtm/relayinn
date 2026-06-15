import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TrialBanner } from '../billing/TrialBanner'
import { useHotelStore } from '../../store/hotelStore'
import { useAuth } from '../../hooks/useAuth'
import { fetchUsageStats, refreshHotel } from '../../lib/settingsService'

export function AppShell() {
  const { currentHotel, setHotel, setUsageStats } = useHotelStore()
  const { user } = useAuth()

  useEffect(() => {
    if (!currentHotel?.id || !user) return
    fetchUsageStats(currentHotel.id).then(({ conversations, teamMembers }) => {
      setUsageStats(teamMembers, conversations)
    })
  }, [currentHotel?.id, user, setUsageStats])

  useEffect(() => {
    if (!currentHotel?.id || !user) return
    const interval = setInterval(() => {
      refreshHotel(currentHotel.id).then((hotel) => {
        if (hotel) setHotel(hotel)
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [currentHotel?.id, user, setHotel])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F7F4]">
      <TrialBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
