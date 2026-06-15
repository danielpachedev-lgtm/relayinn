import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useHotelStore } from '../../store/hotelStore'
import {
  fetchGuestConversations,
  findOrCreateWhatsAppConversation,
} from '../../lib/guestService'
import {
  formatGuestDate,
  getGuestStayStatus,
  GUEST_STAY_LABELS,
  GUEST_STAY_STYLES,
} from '../../lib/guestUtils'
import { relativeTime } from '../../lib/utils'
import type { Conversation, Guest } from '../../types'
import { Button } from '../ui/Button'

interface GuestDetailPanelProps {
  guest: Guest
  isOpen: boolean
  onClose: () => void
  onGuestUpdated: (guest: Guest) => void
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: 'bg-[#22C55E]',
  email: 'bg-[#2563EB]',
  instagram: 'bg-[#A855F7]',
  web: 'bg-[#6B7280]',
}

const CONVO_STATUS_STYLES: Record<string, string> = {
  open: 'bg-[#F3F4F6] text-[#374151]',
  in_progress: 'bg-[#EFF6FF] text-[#2563EB]',
  resolved: 'bg-[#F0FDF4] text-[#16A34A]',
}

export function GuestDetailPanel({
  guest,
  isOpen,
  onClose,
  onGuestUpdated,
}: GuestDetailPanelProps) {
  const navigate = useNavigate()
  const { currentHotel } = useHotelStore()
  const [notes, setNotes] = useState(guest.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvos, setLoadingConvos] = useState(false)
  const [sending, setSending] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const stayStatus = getGuestStayStatus(guest.check_in, guest.check_out)

  useEffect(() => {
    setNotes(guest.notes ?? '')
  }, [guest.id, guest.notes])

  useEffect(() => {
    if (!isOpen) return
    setLoadingConvos(true)
    fetchGuestConversations(guest.id)
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoadingConvos(false))
  }, [isOpen, guest.id])

  async function handleNotesBlur() {
    if (notes === (guest.notes ?? '')) return
    setSavingNotes(true)
    const { data, error } = await supabase
      .from('guests')
      .update({ notes: notes.trim() || null })
      .eq('id', guest.id)
      .select()
      .single()
    if (!error && data) onGuestUpdated(data as Guest)
    setSavingNotes(false)
  }

  async function copyToClipboard(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Could not copy')
    }
  }

  async function handleSendMessage() {
    if (!currentHotel) return
    setSending(true)
    try {
      const convoId = await findOrCreateWhatsAppConversation(currentHotel.id, guest.id)
      navigate(`/inbox?conversation=${convoId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open conversation')
    } finally {
      setSending(false)
    }
  }

  function openConversation(convoId: string) {
    navigate(`/inbox?conversation=${convoId}`)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full bg-white border-l border-[#E5E3DF] shadow-xl z-50 transition-transform duration-200 overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '480px' }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-[#E5E3DF] flex-shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#111827] truncate">{guest.name}</h2>
                {stayStatus && (
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${GUEST_STAY_STYLES[stayStatus]}`}
                  >
                    {GUEST_STAY_LABELS[stayStatus]}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] flex-shrink-0"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Contact */}
            <section>
              <h3 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                Contact
              </h3>
              <div className="space-y-2">
                {guest.phone && (
                  <CopyableRow
                    label="Phone"
                    value={guest.phone}
                    copied={copiedField === 'phone'}
                    onCopy={() => copyToClipboard(guest.phone!, 'phone')}
                  />
                )}
                {guest.email && (
                  <CopyableRow
                    label="Email"
                    value={guest.email}
                    copied={copiedField === 'email'}
                    onCopy={() => copyToClipboard(guest.email!, 'email')}
                  />
                )}
                {!guest.phone && !guest.email && (
                  <p className="text-sm text-[#9CA3AF] italic">No contact info</p>
                )}
              </div>
            </section>

            {/* Stay */}
            <section>
              <h3 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                Stay Details
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <DetailBox label="Room" value={guest.room_number ?? '—'} />
                <DetailBox label="Check-in" value={formatGuestDate(guest.check_in)} />
                <DetailBox label="Check-out" value={formatGuestDate(guest.check_out)} />
              </div>
            </section>

            {/* Notes */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  Notes
                </h3>
                {savingNotes && <span className="text-[11px] text-[#9CA3AF]">Saving…</span>}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes about this guest…"
                rows={4}
                className="w-full resize-none rounded-[8px] border border-[#E5E3DF] px-3 py-2 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] bg-[#F9F8F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </section>

            {/* Conversations */}
            <section>
              <h3 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">
                Open Conversations
              </h3>
              {loadingConvos ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 bg-[#F3F4F6] rounded-[8px] animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] italic">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => openConversation(convo.id)}
                      className="w-full text-left p-3 rounded-[10px] border border-[#E5E3DF] hover:bg-[#F8F7F4] hover:border-[#D1D5DB] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${CHANNEL_COLORS[convo.channel] ?? 'bg-gray-400'}`}
                        />
                        <span className="text-[12px] font-medium text-[#111827] capitalize">
                          {convo.channel}
                        </span>
                        <span
                          className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium ${CONVO_STATUS_STYLES[convo.status]}`}
                        >
                          {convo.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#6B7280] truncate">
                        {convo.last_message?.content ?? 'No messages'}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF] mt-1">
                        {relativeTime(convo.last_message_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* History placeholder */}
            <section>
              <h3 className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                Previous Stays
              </h3>
              <p className="text-sm text-[#6B7280]">1st stay</p>
            </section>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[#E5E3DF] flex-shrink-0">
            <Button
              className="w-full"
              onClick={handleSendMessage}
              loading={sending}
              disabled={!guest.phone}
            >
              Send Message
            </Button>
            {!guest.phone && (
              <p className="text-[11px] text-[#9CA3AF] text-center mt-2">
                Add a phone number to start a WhatsApp conversation
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function CopyableRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <button
      onClick={onCopy}
      className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] border border-[#E5E3DF] hover:bg-[#F8F7F4] group transition-colors text-left"
      title="Click to copy"
    >
      <div>
        <p className="text-[11px] text-[#9CA3AF]">{label}</p>
        <p className="text-[13px] text-[#111827] font-medium">{value}</p>
      </div>
      <span className="text-[11px] text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity">
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  )
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-[#F8F7F4] rounded-[8px]">
      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-medium text-[#111827] mt-0.5">{value}</p>
    </div>
  )
}
