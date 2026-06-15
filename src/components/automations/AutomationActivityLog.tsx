import { useState } from 'react'
import { getAutomationIcon } from '../../lib/automationUtils'
import { relativeTime } from '../../lib/utils'
import type { AutomationLogWithMeta } from '../../lib/automationService'
import type { AutomationTrigger } from '../../types'

interface AutomationActivityLogProps {
  logs: AutomationLogWithMeta[]
  loading: boolean
}

export function AutomationActivityLog({ logs, loading }: AutomationActivityLogProps) {
  if (loading) {
    return (
      <div className="bg-white border border-[#E5E3DF] rounded-[12px] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E3DF]">
          <div className="h-5 w-32 bg-[#E5E3DF] rounded animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-t border-[#E5E3DF] animate-pulse">
            <div className="h-4 w-full bg-[#E5E3DF] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white border border-[#E5E3DF] rounded-[12px] shadow-sm px-6 py-10 text-center">
        <p className="text-sm text-[#6B7280]">
          No automations have been sent yet. Activate an automation above to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E5E3DF] rounded-[12px] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-[#FAFAF8]">
              {['Automation', 'Guest', 'Message', 'Sent'].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <ActivityRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ActivityRow({ log }: { log: AutomationLogWithMeta }) {
  const [expanded, setExpanded] = useState(false)
  const trigger = (log.automation?.trigger ?? log.trigger) as AutomationTrigger
  const icon = getAutomationIcon(trigger)
  const name = log.automation?.name ?? log.trigger
  const guestName = log.guest?.name ?? 'Unknown'
  const truncated =
    log.message_sent.length > 80
      ? log.message_sent.slice(0, 80) + '…'
      : log.message_sent

  return (
    <tr className="border-t border-[#E5E3DF] hover:bg-[#FAFAF8] transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-medium text-[#111827]">{name}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-[#374151]">{guestName}</td>
      <td className="px-5 py-3 text-sm text-[#6B7280] max-w-xs">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-left hover:text-[#111827] transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? log.message_sent : truncated}
        </button>
      </td>
      <td className="px-5 py-3 text-sm text-[#9CA3AF] whitespace-nowrap">
        {relativeTime(log.sent_at)}
      </td>
    </tr>
  )
}
