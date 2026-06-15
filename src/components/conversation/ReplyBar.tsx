import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { QuickReplies } from './QuickReplies'

interface ReplyBarProps {
  guestName: string
  onSend: (content: string, isInternalNote: boolean) => Promise<boolean>
}

type TabType = 'reply' | 'note'

const LINE_HEIGHT = 22
const MIN_ROWS = 3
const MAX_ROWS = 6

export function ReplyBar({ guestName, onSend }: ReplyBarProps) {
  const [tab, setTab] = useState<TabType>('reply')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const newHeight = Math.min(
      Math.max(el.scrollHeight, LINE_HEIGHT * MIN_ROWS),
      LINE_HEIGHT * MAX_ROWS
    )
    el.style.height = `${newHeight}px`
  }, [text])

  async function handleSend() {
    if (!text.trim() || sending) return
    setSending(true)
    const ok = await onSend(text, tab === 'note')
    if (ok) setText('')
    setSending(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const isNote = tab === 'note'

  return (
    <div className="flex-shrink-0 bg-white border-t border-[#E5E3DF] px-4 pt-3 pb-4">
      {/* Tab toggle */}
      <div className="flex gap-0 mb-2">
        {(['reply', 'note'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] transition-colors ${
              tab === t
                ? t === 'note'
                  ? 'bg-[#FEF9C3] text-[#713F12]'
                  : 'bg-[#EFF6FF] text-[#2563EB]'
                : 'text-[#9CA3AF] hover:text-[#374151]'
            }`}
          >
            {t === 'reply' ? 'Reply' : '🔒 Internal Note'}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isNote
            ? 'Add internal note (only visible to staff)...'
            : `Reply to ${guestName}...`
        }
        rows={MIN_ROWS}
        className={`
          w-full resize-none rounded-[10px] border px-3.5 py-2.5 text-[14px]
          text-[#111827] placeholder:text-[#9CA3AF]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
          transition-colors
          ${isNote
            ? 'bg-[#FFFBEB] border-[#FDE68A]'
            : 'bg-[#F9F8F6] border-[#E5E3DF]'
          }
        `}
        style={{ minHeight: `${LINE_HEIGHT * MIN_ROWS}px` }}
      />

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="relative">
          <button
            onClick={() => setQuickRepliesOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E3DF] text-[12px] font-medium text-[#374151] hover:bg-[#F9F8F6] transition-colors"
          >
            <LightningIcon />
            Quick Replies
          </button>
          {quickRepliesOpen && (
            <QuickReplies
              guestName={guestName}
              onSelect={(t) => { setText(t); textareaRef.current?.focus() }}
              onClose={() => setQuickRepliesOpen(false)}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#9CA3AF]">{text.length}</span>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[13px] font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SendIcon />
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function LightningIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}
