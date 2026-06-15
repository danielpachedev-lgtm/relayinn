import { useEffect, useRef } from 'react'
import { useQuickReplies } from '../../hooks/useQuickReplies'

interface QuickRepliesProps {
  guestName: string
  onSelect: (text: string) => void
  onClose: () => void
}

export function QuickReplies({ guestName, onSelect, onClose }: QuickRepliesProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { replies, loading } = useQuickReplies()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  function handleSelect(body: string) {
    const filled = body.replace(/\[Guest Name\]/g, guestName)
    onSelect(filled)
    onClose()
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-[340px] bg-white rounded-[12px] border border-[#E5E3DF] shadow-lg z-50 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-[#E5E3DF]">
        <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
          Quick Replies
        </p>
      </div>
      <div className="py-1 max-h-64 overflow-y-auto">
        {loading ? (
          <p className="px-3 py-4 text-xs text-[#9CA3AF] text-center">Loading…</p>
        ) : replies.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[#9CA3AF] text-center">
            No quick replies. Add them in Settings.
          </p>
        ) : (
          replies.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.message)}
              className="w-full text-left px-3 py-2.5 hover:bg-[#F8F7F4] transition-colors group"
            >
              <p className="text-[13px] font-medium text-[#111827] group-hover:text-[#2563EB]">
                {t.name}
              </p>
              <p className="text-[12px] text-[#9CA3AF] truncate mt-0.5">{t.message}</p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
