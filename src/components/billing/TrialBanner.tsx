import { Link } from 'react-router-dom'
import { useHotelStore } from '../../store/hotelStore'
import { getTrialDaysRemaining } from '../../lib/planLimits'

export function TrialBanner() {
  const { currentHotel } = useHotelStore()

  if (!currentHotel || currentHotel.subscription_status !== 'trial') {
    return null
  }

  const days = getTrialDaysRemaining(currentHotel.trial_ends_at)

  return (
    <div className="w-full bg-[#FEF9C3] border-b border-[#FDE68A] px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-[#713F12] flex-shrink-0">
      <span>
        ⏳ Your free trial ends in {days} {days === 1 ? 'day' : 'days'}.
      </span>
      <Link
        to="/settings?section=billing"
        className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap"
      >
        Upgrade now →
      </Link>
    </div>
  )
}
