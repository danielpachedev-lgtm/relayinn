import { useInboxStore } from '../../store/inboxStore'
import { ConversationItem } from './ConversationItem'
import type { Conversation } from '../../types'

interface ConversationListProps {
  loading: boolean
  onSelect: (conversation: Conversation) => void
  guestFilterId?: string | null
}

export function ConversationList({ loading, onSelect, guestFilterId }: ConversationListProps) {
  const { conversations, activeConversation } = useInboxStore()

  const visible = guestFilterId
    ? conversations.filter((c) => c.guest_id === guestFilterId)
    : conversations

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <p className="text-sm text-[#9CA3AF] text-center leading-relaxed">
          {guestFilterId
            ? 'No conversations for this guest.'
            : "No conversations yet. When guests message your hotel, they'll appear here."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {visible.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={activeConversation?.id === conversation.id}
          onClick={() => onSelect(conversation)}
        />
      ))}
    </div>
  )
}

function SkeletonItem() {
  return (
    <div className="px-4 py-3.5 border-b border-[#E5E3DF] flex flex-col gap-2.5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#E5E3DF]" />
          <div className="h-2 w-2 rounded-full bg-[#E5E3DF]" />
          <div className="h-3.5 w-28 rounded bg-[#E5E3DF]" />
        </div>
        <div className="h-3 w-10 rounded bg-[#E5E3DF]" />
      </div>
      <div className="h-3 w-4/5 rounded bg-[#E5E3DF] ml-6" />
      <div className="h-3 w-12 rounded bg-[#E5E3DF] ml-6" />
    </div>
  )
}
