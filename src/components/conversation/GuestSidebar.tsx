import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Guest } from '../../types'

interface GuestSidebarProps {
  guest: Guest | null | undefined
  isOpen: boolean
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function GuestSidebar({ guest, isOpen }: GuestSidebarProps) {
  const [notes, setNotes] = useState(guest?.notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNotes(guest?.notes ?? '')
  }, [guest?.id])

  async function handleNotesBlur() {
    if (!guest || notes === guest.notes) return
    setSaving(true)
    await supabase.from('guests').update({ notes }).eq('id', guest.id)
    setSaving(false)
  }

  return (
    <div
      className={`flex-shrink-0 border-l border-[#E5E3DF] bg-white overflow-hidden transition-all duration-200 ${
        isOpen ? 'w-[280px]' : 'w-0'
      }`}
    >
      <div className="w-[280px] h-full overflow-y-auto">
        <div className="px-4 py-4">
          <h3 className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Guest Profile
          </h3>

          {!guest ? (
            <p className="text-sm text-[#9CA3AF] italic">No guest linked</p>
          ) : (
            <div className="space-y-5">
              {/* Identity */}
              <div>
                <p className="text-[15px] font-semibold text-[#111827]">{guest.name}</p>
                {guest.phone && (
                  <p className="text-[13px] text-[#6B7280] mt-0.5">{guest.phone}</p>
                )}
                {guest.email && (
                  <p className="text-[13px] text-[#6B7280] mt-0.5">{guest.email}</p>
                )}
              </div>

              {/* Current stay */}
              <div>
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                  Current Stay
                </p>
                <div className="space-y-1.5">
                  {guest.room_number && (
                    <Row label="Room" value={guest.room_number} />
                  )}
                  <Row label="Check-in" value={formatDate(guest.check_in)} />
                  <Row label="Check-out" value={formatDate(guest.check_out)} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    Notes
                  </p>
                  {saving && (
                    <span className="text-[11px] text-[#9CA3AF]">Saving…</span>
                  )}
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add notes about this guest…"
                  rows={4}
                  className="w-full resize-none rounded-[8px] border border-[#E5E3DF] px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] bg-[#F9F8F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors"
                />
              </div>

              {/* Stay count */}
              <div>
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                  History
                </p>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F7F4] rounded-[8px]">
                  <span className="text-[20px]">🏨</span>
                  <div>
                    <p className="text-[13px] font-medium text-[#111827]">1st stay</p>
                    <p className="text-[12px] text-[#6B7280]">First time guest</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[#9CA3AF]">{label}</span>
      <span className="text-[13px] text-[#111827] font-medium">{value}</span>
    </div>
  )
}
