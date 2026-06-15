import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HotelProfileSection } from '../../components/settings/HotelProfileSection'
import { TeamSection } from '../../components/settings/TeamSection'
import { QuickRepliesSection } from '../../components/settings/QuickRepliesSection'
import { IntegrationsSection } from '../../components/settings/IntegrationsSection'
import { BillingSection } from '../../components/settings/BillingSection'

const SECTIONS = [
  { id: 'profile', label: 'Hotel Profile' },
  { id: 'team', label: 'Team' },
  { id: 'quick-replies', label: 'Quick Replies' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

export function SettingsPage() {
  const [searchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const initialSection: SectionId =
    sectionParam && SECTIONS.some((s) => s.id === sectionParam)
      ? (sectionParam as SectionId)
      : 'profile'
  const [active, setActive] = useState<SectionId>(initialSection)

  useEffect(() => {
    if (sectionParam && SECTIONS.some((s) => s.id === sectionParam)) {
      setActive(sectionParam as SectionId)
    }
  }, [sectionParam])

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#E5E3DF] bg-white">
        <h1 className="text-lg font-semibold text-[#111827]">Settings</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Configure your hotel, team, and integrations
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-[200px] flex-shrink-0 bg-[#F3F4F6] p-3 m-4 mr-0 rounded-[10px] self-start">
          <ul className="space-y-0.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActive(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-[8px] text-sm font-medium transition-colors ${
                    active === section.id
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-white/60'
                  }`}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 overflow-y-auto p-6 pl-4">
          {active === 'profile' && <HotelProfileSection />}
          {active === 'team' && <TeamSection />}
          {active === 'quick-replies' && <QuickRepliesSection />}
          {active === 'integrations' && <IntegrationsSection />}
          {active === 'billing' && <BillingSection />}
        </div>
      </div>
    </div>
  )
}
