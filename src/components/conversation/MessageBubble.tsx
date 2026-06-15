import type { Message, Staff } from '../../types'

interface MessageBubbleProps {
  message: Message
  staffMap: Record<string, Staff>
  guestName: string
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBubble({ message, staffMap, guestName }: MessageBubbleProps) {
  const { sender_type, content, is_internal_note, sender_id, created_at } = message
  const senderName =
    sender_type === 'staff' && sender_id ? (staffMap[sender_id]?.name ?? 'Staff') : guestName

  // Internal note
  if (is_internal_note) {
    return (
      <div className="flex flex-col items-start max-w-[72%]">
        <span className="text-[11px] text-[#9CA3AF] mb-1 pl-1">🔒 Internal note</span>
        <div className="bg-[#FEF9C3] border border-[#FDE68A] rounded-[12px] rounded-bl-[4px] px-3.5 py-2.5">
          <p className="text-[14px] text-[#713F12] whitespace-pre-wrap break-words">{content}</p>
        </div>
        <span className="text-[11px] text-[#9CA3AF] mt-1 pl-1">
          {senderName} · {formatTime(created_at)}
        </span>
      </div>
    )
  }

  // System message
  if (sender_type === 'system') {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[12px] text-[#9CA3AF] italic">⚙ {content}</span>
      </div>
    )
  }

  // Staff message (right-aligned, blue bubble)
  if (sender_type === 'staff') {
    return (
      <div className="flex flex-col items-end max-w-[72%] ml-auto">
        <div className="bg-[#2563EB] rounded-[12px] rounded-br-[4px] px-3.5 py-2.5">
          <p className="text-[14px] text-white whitespace-pre-wrap break-words">{content}</p>
        </div>
        <span className="text-[11px] text-[#9CA3AF] mt-1 pr-1">
          {senderName} · {formatTime(created_at)}
        </span>
      </div>
    )
  }

  // Guest message (left-aligned, white bubble)
  return (
    <div className="flex flex-col items-start max-w-[72%]">
      <div className="bg-white border border-[#E5E3DF] rounded-[12px] rounded-bl-[4px] px-3.5 py-2.5">
        <p className="text-[14px] text-[#111827] whitespace-pre-wrap break-words">{content}</p>
      </div>
      <span className="text-[11px] text-[#9CA3AF] mt-1 pl-1">
        {senderName} · {formatTime(created_at)}
      </span>
    </div>
  )
}
