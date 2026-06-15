import { useMemo, useState } from 'react'
import { AUTOMATION_DEFINITIONS } from '../../lib/automationDefaults'
import { useAutomations } from '../../hooks/useAutomations'
import { AutomationCard } from '../../components/automations/AutomationCard'
import { AutomationActivityLog } from '../../components/automations/AutomationActivityLog'
import { TestAutomationModal } from '../../components/automations/TestAutomationModal'
import type { Automation } from '../../types'

export function AutomationsPage() {
  const {
    automations,
    logs,
    loading,
    logsLoading,
    setAutomations,
    reloadLogs,
    reloadAutomations,
  } = useAutomations()

  const [testAutomation, setTestAutomation] = useState<Automation | null>(null)

  const sortedAutomations = useMemo(() => {
    const order = AUTOMATION_DEFINITIONS.map((d) => d.trigger)
    return [...automations].sort(
      (a, b) => order.indexOf(a.trigger) - order.indexOf(b.trigger)
    )
  }, [automations])

  function handleUpdated(updated: Automation) {
    setAutomations((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    )
  }

  function handleTestSent() {
    reloadLogs()
    reloadAutomations()
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F8F7F4]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-[#111827]">Automations</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Set up automatic messages for your guests at key moments of their stay.
          </p>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-[#E5E3DF] rounded-[12px] p-5 h-40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
            {sortedAutomations.map((automation) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                onUpdated={handleUpdated}
                onTest={setTestAutomation}
              />
            ))}
          </div>
        )}

        {/* Activity log */}
        <div>
          <h2 className="text-[16px] font-bold text-[#111827] mb-4">Recent Activity</h2>
          <AutomationActivityLog logs={logs} loading={logsLoading} />
        </div>
      </div>

      <TestAutomationModal
        open={!!testAutomation}
        automation={testAutomation}
        onClose={() => setTestAutomation(null)}
        onSent={handleTestSent}
      />
    </div>
  )
}
