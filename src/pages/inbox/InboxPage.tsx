import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConversations, type StatusFilter } from '../../hooks/useConversations'
import { useInboxStore } from '../../store/inboxStore'
import { useHotelStore, usePlanEnforcement } from '../../store/hotelStore'
import { supabase } from '../../lib/supabase'
import { ConversationList } from '../../components/inbox/ConversationList'
import { ConversationView } from '../../components/conversation/ConversationView'
import { seedTestData } from '../../lib/seedData'
import type { Conversation } from '../../types'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
]

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const conversationParam = searchParams.get('conversation')
  const guestParam = searchParams.get('guest')

  const { loading, statusFilter, setStatusFilter, search, handleSearchChange, setSearchQuery, reload } =
    useConversations()
  const { setActiveConversation, activeConversation, conversations } = useInboxStore()
  const { currentHotel } = useHotelStore()
  const { canStartConversation } = usePlanEnforcement()
  const [seeding, setSeeding] = useState(false)
  const [seedDone, setSeedDone] = useState(false)
  const [seedError, setSeedError] = useState('')
  const [guestFilterId, setGuestFilterId] = useState<string | null>(guestParam)

  // Apply guest filter from URL + load guest name into search
  useEffect(() => {
    if (!guestParam) {
      setGuestFilterId(null)
      return
    }
    setGuestFilterId(guestParam)
    supabase
      .from('guests')
      .select('name')
      .eq('id', guestParam)
      .single()
      .then(({ data }) => {
        if (data?.name) setSearchQuery(data.name)
      })
  }, [guestParam, setSearchQuery])

  // Select conversation from URL once loaded
  useEffect(() => {
    if (!conversationParam || loading || conversations.length === 0) return
    const conv = conversations.find((c) => c.id === conversationParam)
    if (conv) {
      setActiveConversation(conv)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('conversation')
        return next
      }, { replace: true })
    }
  }, [conversationParam, loading, conversations, setActiveConversation, setSearchParams])

  function handleSelectConversation(conversation: Conversation) {
    setActiveConversation(conversation)
    if (guestParam) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('guest')
        return next
      }, { replace: true })
      setGuestFilterId(null)
    }
  }

  async function handleSeed() {
    if (!currentHotel) {
      setSeedError('Hotel not loaded yet — try refreshing the page')
      return
    }
    setSeeding(true)
    setSeedError('')
    try {
      await seedTestData(currentHotel.id)
      setSeedDone(true)
      reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setSeedError(msg)
      console.error(err)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="flex h-full">
      {/* ── Left panel ── */}
      <div className="flex flex-col w-[380px] flex-shrink-0 bg-white border-r border-[#E5E3DF] h-full">
        {/* Header */}
        <div className="px-4 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[18px] font-bold text-[#111827]">Inbox</h1>
            {!seedDone && (
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="text-[11px] text-[#6B7280] hover:text-[#111827] border border-[#E5E3DF] rounded-[6px] px-2 py-1 transition-colors disabled:opacity-50"
              >
                {seeding ? 'Seeding…' : 'Seed test data'}
              </button>
            )}
          </div>

          {seedError && (
            <p className="text-[11px] text-[#DC2626] mb-2">{seedError}</p>
          )}

          {!canStartConversation && (
            <div className="mb-3 p-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[11px] text-[#DC2626] leading-snug">
              You&apos;ve reached your monthly conversation limit.{' '}
              <a href="/settings?section=billing" className="font-semibold underline">
                Upgrade to continue
              </a>
            </div>
          )}

          {/* Status filter tabs */}
          <div className="flex gap-0 border-b border-[#E5E3DF]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-2 text-[13px] font-medium transition-colors relative ${
                  statusFilter === tab.id
                    ? 'text-[#2563EB]'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                {tab.label}
                {statusFilter === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2563EB] rounded-t" />
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative py-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search guests or messages…"
              className="w-full pl-8 pr-3 py-2 text-[13px] text-[#111827] bg-[#F8F7F4] border border-[#E5E3DF] rounded-[8px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Conversation list */}
        <ConversationList
          loading={loading}
          onSelect={handleSelectConversation}
          guestFilterId={guestFilterId}
        />
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-hidden bg-[#F8F7F4]">
        {activeConversation ? (
          <ConversationView key={activeConversation.id} conversation={activeConversation} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyRight />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyRight() {
  return (
    <div className="flex flex-col items-center gap-3 text-center max-w-xs px-6">
      <div className="h-12 w-12 rounded-full bg-[#E5E3DF] flex items-center justify-center">
        <svg
          className="h-6 w-6 text-[#9CA3AF]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
          />
        </svg>
      </div>
      <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
        Select a conversation to start
      </p>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}
