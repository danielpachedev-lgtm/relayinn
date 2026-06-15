import { useState, useRef, useEffect } from 'react'
import { useConversationActions } from '../../hooks/useConversationActions'
import { useStaff } from '../../hooks/useStaff'
import { useHotelStore } from '../../store/hotelStore'
import { Avatar } from '../ui/Avatar'
import type { Conversation, ConversationChannel, ConversationStatus } from '../../types'

interface ConversationHeaderProps {
  conversation: Conversation
  onToggleGuestSidebar: () => void
  guestSidebarOpen: boolean
}

const CHANNEL_STYLES: Record<ConversationChannel, string> = {
  whatsapp: 'bg-[#22C55E] text-white',
  email: 'bg-[#2563EB] text-white',
  instagram: 'bg-[#A855F7] text-white',
  web: 'bg-[#6B7280] text-white',
}

const CHANNEL_LABELS: Record<ConversationChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  instagram: 'Instagram',
  web: 'Web',
}

const STATUS_STYLES: Record<ConversationStatus, string> = {
  open: 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]',
  in_progress: 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]',
  resolved: 'bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7]',
}

const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function ConversationHeader({
  conversation,
  onToggleGuestSidebar,
  guestSidebarOpen,
}: ConversationHeaderProps) {
  const { cycleStatus, assignTo, toggleUrgent, resolve } = useConversationActions(
    conversation.id
  )
  const { staff } = useStaff()
  const { currentStaff } = useHotelStore()
  const [assignOpen, setAssignOpen] = useState(false)
  const assignRef = useRef<HTMLDivElement>(null)

  const guest = conversation.guest
  const assignedStaff = staff.find((s) => s.id === conversation.assigned_to)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) {
        setAssignOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#E5E3DF] flex-shrink-0 min-w-0">
      {/* Left: guest info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-bold text-[#111827] truncate">
            {guest?.name ?? 'Unknown Guest'}
          </h2>
          <button
            onClick={onToggleGuestSidebar}
            title="Guest profile"
            className={`flex-shrink-0 p-1 rounded-[6px] transition-colors ${
              guestSidebarOpen
                ? 'bg-[#EFF6FF] text-[#2563EB]'
                : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6]'
            }`}
          >
            <GuestIcon />
          </button>
        </div>
        {(guest?.room_number || guest?.check_in) && (
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {guest.room_number && `Room ${guest.room_number}`}
            {guest.room_number && guest.check_in && ' · '}
            {guest.check_in &&
              `Check-in ${formatDate(guest.check_in)} → Check-out ${formatDate(guest.check_out)}`}
          </p>
        )}
      </div>

      {/* Center: channel + status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            CHANNEL_STYLES[conversation.channel]
          }`}
        >
          {CHANNEL_LABELS[conversation.channel]}
        </span>
        <button
          onClick={cycleStatus}
          title="Click to change status"
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
            STATUS_STYLES[conversation.status]
          }`}
        >
          {STATUS_LABELS[conversation.status]}
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Assign */}
        <div className="relative" ref={assignRef}>
          <button
            onClick={() => setAssignOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#E5E3DF] bg-white text-[12px] text-[#374151] hover:bg-[#F9F8F6] transition-colors"
          >
            {assignedStaff ? (
              <>
                <Avatar name={assignedStaff.name} src={assignedStaff.avatar_url} size="sm" />
                <span className="max-w-[80px] truncate">{assignedStaff.name}</span>
              </>
            ) : (
              <>
                <UnassignedIcon />
                <span>Unassigned</span>
              </>
            )}
            <ChevronIcon />
          </button>

          {assignOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-[10px] border border-[#E5E3DF] shadow-lg z-50 py-1 overflow-hidden">
              <button
                onClick={() => { assignTo(null); setAssignOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#6B7280] hover:bg-[#F8F7F4] transition-colors"
              >
                <UnassignedIcon />
                Unassigned
              </button>
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { assignTo(s.id, s.name); setAssignOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] hover:bg-[#F8F7F4] transition-colors ${
                    s.id === conversation.assigned_to
                      ? 'text-[#2563EB] font-medium'
                      : 'text-[#111827]'
                  }`}
                >
                  <Avatar name={s.name} src={s.avatar_url} size="sm" />
                  <span className="truncate">{s.name}</span>
                  {s.id === currentStaff?.id && (
                    <span className="ml-auto text-[11px] text-[#9CA3AF]">you</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Urgent toggle */}
        <button
          onClick={toggleUrgent}
          title={conversation.is_urgent ? 'Remove urgent' : 'Mark as urgent'}
          className={`p-1.5 rounded-[8px] transition-colors ${
            conversation.is_urgent
              ? 'text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
              : 'text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6]'
          }`}
        >
          <FlagIcon />
        </button>

        {/* Resolve */}
        {conversation.status !== 'resolved' && (
          <button
            onClick={resolve}
            className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  )
}

function GuestIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
function FlagIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  )
}
function UnassignedIcon() {
  return (
    <svg className="h-4 w-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg className="h-3 w-3 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
