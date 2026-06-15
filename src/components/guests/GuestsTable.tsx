import type { GuestWithMeta } from '../../types'
import type { GuestStayStatus } from '../../lib/guestUtils'
import {
  formatGuestDate,
  getGuestStayStatus,
  GUEST_STAY_LABELS,
  GUEST_STAY_STYLES,
} from '../../lib/guestUtils'
import { GuestKebabMenu } from './GuestKebabMenu'

export type StayFilter = 'all' | GuestStayStatus

interface GuestsTableProps {
  guests: GuestWithMeta[]
  loading: boolean
  onView: (guest: GuestWithMeta) => void
  onEdit: (guest: GuestWithMeta) => void
  onDelete: (guest: GuestWithMeta) => void
  onConversationsClick: (guest: GuestWithMeta) => void
}

export function GuestsTable({
  guests,
  loading,
  onView,
  onEdit,
  onDelete,
  onConversationsClick,
}: GuestsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-[12px] border border-[#E5E3DF] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <TableHead />
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-[#E5E3DF] animate-pulse">
                <td className="px-5 py-4"><div className="h-4 w-32 bg-[#E5E3DF] rounded" /></td>
                <td className="px-5 py-4"><div className="h-5 w-12 bg-[#E5E3DF] rounded-full" /></td>
                <td className="px-5 py-4"><div className="h-4 w-20 bg-[#E5E3DF] rounded" /></td>
                <td className="px-5 py-4"><div className="h-4 w-20 bg-[#E5E3DF] rounded" /></td>
                <td className="px-5 py-4"><div className="h-5 w-16 bg-[#E5E3DF] rounded-full" /></td>
                <td className="px-5 py-4"><div className="h-4 w-8 bg-[#E5E3DF] rounded" /></td>
                <td className="px-5 py-4"><div className="h-8 w-20 bg-[#E5E3DF] rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E3DF] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <TableHead />
          </thead>
          <tbody>
            {guests.map((guest) => {
              const stayStatus = getGuestStayStatus(guest.check_in, guest.check_out)
              return (
                <tr
                  key={guest.id}
                  className="border-t border-[#E5E3DF] hover:bg-[#FAFAF8] transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#111827]">{guest.name}</p>
                    {guest.email && (
                      <p className="text-[12px] text-[#6B7280] mt-0.5">{guest.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {guest.room_number ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#F3F4F6] text-[#374151]">
                        {guest.room_number}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {formatGuestDate(guest.check_in)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#374151]">
                    {formatGuestDate(guest.check_out)}
                  </td>
                  <td className="px-5 py-4">
                    {stayStatus ? (
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${GUEST_STAY_STYLES[stayStatus]}`}
                      >
                        {GUEST_STAY_LABELS[stayStatus]}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onConversationsClick(guest)}
                      className="text-sm font-medium text-[#2563EB] hover:underline"
                    >
                      {guest.conversation_count}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onView(guest)}
                        className="px-3 py-1.5 text-[12px] font-medium text-[#374151] border border-[#E5E3DF] rounded-[6px] hover:bg-[#F8F7F4] transition-colors"
                      >
                        View
                      </button>
                      <GuestKebabMenu
                        onEdit={() => onEdit(guest)}
                        onDelete={() => onDelete(guest)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableHead() {
  const cols = [
    'Guest',
    'Room',
    'Check-in',
    'Check-out',
    'Status',
    'Conversations',
    'Actions',
  ]
  return (
    <tr className="bg-[#FAFAF8]">
      {cols.map((col) => (
        <th
          key={col}
          className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider"
        >
          {col}
        </th>
      ))}
    </tr>
  )
}
