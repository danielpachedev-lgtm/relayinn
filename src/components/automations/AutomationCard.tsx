import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Toggle } from '../ui/Toggle'
import { Button } from '../ui/Button'
import { AUTOMATION_VARIABLES } from '../../lib/automationDefaults'
import { getDefinitionByTrigger } from '../../lib/automationDefaults'
import { updateAutomation } from '../../lib/automationService'
import { relativeTime } from '../../lib/utils'
import type { Automation } from '../../types'

interface AutomationCardProps {
  automation: Automation
  onUpdated: (automation: Automation) => void
  onTest: (automation: Automation) => void
}

export function AutomationCard({ automation, onUpdated, onTest }: AutomationCardProps) {
  const def = getDefinitionByTrigger(automation.trigger)
  const [draft, setDraft] = useState(automation.message_template)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(automation.message_template)
  }, [automation.message_template])

  const isDirty = draft !== automation.message_template

  async function handleToggle(active: boolean) {
    setToggling(true)
    try {
      const updated = await updateAutomation(automation.id, { is_active: active })
      onUpdated(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setToggling(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateAutomation(automation.id, {
        message_template: draft,
      })
      onUpdated(updated)
      toast.success('Saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function insertVariable(variable: string) {
    const el = textareaRef.current
    if (!el) {
      setDraft((prev) => prev + variable)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = draft.slice(0, start) + variable + draft.slice(end)
    setDraft(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + variable.length
      el.setSelectionRange(pos, pos)
    })
  }

  const lastSentLabel = automation.last_sent_at
    ? `Last sent: ${relativeTime(automation.last_sent_at)}`
    : 'Never sent'

  return (
    <div className="bg-white border border-[#E5E3DF] rounded-[12px] shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0" aria-hidden>
            {def?.icon ?? '⚡'}
          </span>
          <div className="min-w-0">
            <h3 className="text-[16px] font-bold text-[#111827]">{automation.name}</h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5 leading-snug">
              {def?.description ?? automation.trigger}
            </p>
          </div>
        </div>
        <Toggle
          checked={automation.is_active}
          onChange={handleToggle}
          disabled={toggling}
        />
      </div>

      {/* Template (only when active) */}
      {automation.is_active && (
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-[8px] border border-[#E5E3DF] px-3 py-2.5 text-[13px] text-[#111827] bg-[#F9F8F6] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
          />

          <div>
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-2">
              Variables
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AUTOMATION_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="px-2 py-1 text-[11px] font-medium rounded-[6px] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F3F2EF]">
        <p className="text-[12px] text-[#9CA3AF]">{lastSentLabel}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTest(automation)}
            className="px-3 py-1.5 text-[12px] font-medium text-[#374151] border border-[#E5E3DF] rounded-[6px] hover:bg-[#F8F7F4] transition-colors"
          >
            Test
          </button>
          {automation.is_active && isDirty && (
            <Button size="sm" onClick={handleSave} loading={saving}>
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
