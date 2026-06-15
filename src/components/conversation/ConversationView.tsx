import { useState } from 'react'
import toast from 'react-hot-toast'
import { useMessages } from '../../hooks/useMessages'
import { useStaff } from '../../hooks/useStaff'
import { useHotelStore } from '../../store/hotelStore'
import { ConversationHeader } from './ConversationHeader'
import { MessageThread } from './MessageThread'
import { ReplyBar } from './ReplyBar'
import { GuestSidebar } from './GuestSidebar'
import type { Conversation, Staff } from '../../types'

interface ConversationViewProps {
  conversation: Conversation
}

export function ConversationView({ conversation }: ConversationViewProps) {
  const { currentStaff } = useHotelStore()
  const { staff } = useStaff()
  const { messages, scrollRef, sendMessage } = useMessages(conversation.id)
  const [guestSidebarOpen, setGuestSidebarOpen] = useState(false)

  const staffMap = staff.reduce<Record<string, Staff>>(
    (acc, s) => ({ ...acc, [s.id]: s }),
    {}
  )

  const guestName = conversation.guest?.name ?? 'Guest'

  async function handleSend(content: string, isInternalNote: boolean): Promise<boolean> {
    if (!currentStaff) return false
    const result = await sendMessage(
      content,
      isInternalNote,
      currentStaff.id,
      conversation.channel
    )
    if (!result.ok) {
      if (result.status === 429) {
        toast.error('Too many messages. Please wait and try again.')
      } else {
        toast.error(result.error ?? 'Failed to send message. Try again.')
      }
      return false
    }
    return true
  }

  return (
    <div className="flex h-full min-w-0">
      {/* Main conversation column */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <ConversationHeader
          conversation={conversation}
          onToggleGuestSidebar={() => setGuestSidebarOpen((o) => !o)}
          guestSidebarOpen={guestSidebarOpen}
        />

        {messages === null ? (
          <LoadingThread />
        ) : (
          <MessageThread
            messages={messages}
            staffMap={staffMap}
            guestName={guestName}
            scrollRef={scrollRef}
          />
        )}

        <ReplyBar guestName={guestName} onSend={handleSend} />
      </div>

      {/* Guest sidebar */}
      <GuestSidebar guest={conversation.guest} isOpen={guestSidebarOpen} />
    </div>
  )
}

function LoadingThread() {
  return (
    <div className="flex-1 bg-[#F8F7F4] flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}
