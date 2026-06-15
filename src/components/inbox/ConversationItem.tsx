import type { Conversation, ConversationChannel } from '../../types'
import { relativeTime } from '../../lib/utils'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { guest, last_message, channel, is_urgent, status } = conversation
  const guestName = guest?.name ?? 'Unknown Guest'
  const isUnknownGuest = guestName === 'Unknown Guest'
  const isUnread = last_message?.sender_type === 'guest' && !last_message?.read_at

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3.5 border-b border-[#E5E3DF] transition-colors relative
        flex flex-col gap-1.5
        ${isActive
          ? 'bg-[#EFF6FF] border-l-[3px] border-l-[#2563EB] pl-[13px]'
          : 'bg-white border-l-[3px] border-l-transparent hover:bg-[#F8F7F4]'
        }
      `}
    >
      {/* Row 1: guest name + room */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Unread dot */}
          <span
            className={`flex-shrink-0 h-2 w-2 rounded-full transition-opacity ${
              isUnread ? 'bg-[#2563EB]' : 'opacity-0'
            }`}
          />
          {/* Channel dot */}
          <ChannelDot channel={channel} />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[14px] text-[#111827] truncate">
              {guestName}
            </span>
            {isUnknownGuest && guest?.phone && (
              <span className="text-[12px] text-[#6B7280] truncate">{guest.phone}</span>
            )}
          </div>
        </div>
        {guest?.room_number && (
          <span className="flex-shrink-0 text-[12px] text-[#6B7280]">
            Rm {guest.room_number}
          </span>
        )}
      </div>

      {/* Row 2: message preview */}
      <p className="text-[13px] text-[#6B7280] truncate pl-6 leading-snug">
        {last_message
          ? formatPreview(last_message.content, last_message.sender_type)
          : <span className="italic">No messages yet</span>
        }
      </p>

      {/* Row 3: time + badges */}
      <div className="flex items-center justify-between pl-6">
        <span className="text-[12px] text-[#9CA3AF]">
          {relativeTime(conversation.last_message_at)}
        </span>
        <div className="flex items-center gap-1.5">
          {status === 'in_progress' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FEF3C7] text-[#92400E]">
              In progress
            </span>
          )}
          {status === 'resolved' && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F0FDF4] text-[#166534]">
              Resolved
            </span>
          )}
          {is_urgent && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FEF2F2] text-[#DC2626]">
              URGENT
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChannelDot({ channel }: { channel: ConversationChannel }) {
  const colors: Record<ConversationChannel, string> = {
    whatsapp: 'bg-[#22C55E]',
    email: 'bg-[#2563EB]',
    instagram: 'bg-[#A855F7]',
    web: 'bg-[#6B7280]',
  }
  const titles: Record<ConversationChannel, string> = {
    whatsapp: 'Via WhatsApp',
    email: 'Via Email',
    instagram: 'Via Instagram',
    web: 'Via Web',
  }
  return (
    <span
      className={`flex-shrink-0 h-2 w-2 rounded-full ${colors[channel]}`}
      title={titles[channel]}
    />
  )
}

function formatPreview(content: string, senderType: string): string {
  const prefix = senderType === 'staff' ? 'You: ' : senderType === 'system' ? '⚙ ' : ''
  return prefix + content
}
