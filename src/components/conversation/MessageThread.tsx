import type { RefObject } from 'react'
import type { Message, Staff } from '../../types'
import { MessageBubble } from './MessageBubble'

interface MessageThreadProps {
  messages: Message[]
  staffMap: Record<string, Staff>
  guestName: string
  scrollRef: RefObject<HTMLDivElement | null>
}

function getDayKey(dateStr: string) {
  return dateStr.split('T')[0]
}

function formatDateLabel(dayKey: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dayKey === today.toISOString().split('T')[0]) return 'Today'
  if (dayKey === yesterday.toISOString().split('T')[0]) return 'Yesterday'

  return new Date(dayKey).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function MessageThread({ messages, staffMap, guestName, scrollRef }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 bg-[#F8F7F4] flex items-center justify-center"
      >
        <p className="text-sm text-[#9CA3AF] italic">No messages yet</p>
      </div>
    )
  }

  // Group messages by day, inserting date separators
  const rendered: React.ReactNode[] = []
  let lastDay = ''

  messages.forEach((msg) => {
    const day = getDayKey(msg.created_at)
    if (day !== lastDay) {
      rendered.push(
        <div key={`sep-${day}`} className="flex items-center justify-center my-3">
          <span className="px-3 py-1 rounded-full bg-[#E5E3DF] text-[11px] text-[#6B7280] font-medium">
            {formatDateLabel(day)}
          </span>
        </div>
      )
      lastDay = day
    }
    rendered.push(
      <MessageBubble
        key={msg.id}
        message={msg}
        staffMap={staffMap}
        guestName={guestName}
      />
    )
  })

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-4 bg-[#F8F7F4] flex flex-col gap-2"
    >
      {rendered}
    </div>
  )
}
