import { APP_NAME, APP_URL } from '../../lib/brand'

const CONVERSATIONS = [
  {
    name: 'Juan García',
    room: '204',
    channel: 'whatsapp' as const,
    preview: 'Thank you!',
    time: '2m ago',
    unread: true,
    active: true,
    urgent: false,
    status: null,
  },
  {
    name: 'Sarah Smith',
    room: '101',
    channel: 'email' as const,
    preview: 'You: Done! Late checkout confirmed until 2pm.',
    time: '1h ago',
    unread: false,
    active: false,
    urgent: false,
    status: 'resolved' as const,
  },
  {
    name: 'Carlos López',
    room: '308',
    channel: 'whatsapp' as const,
    preview: 'Still not fixed, been waiting 2 hours',
    time: '3h ago',
    unread: true,
    active: false,
    urgent: true,
    status: 'in_progress' as const,
  },
]

const CHANNEL_COLORS = {
  whatsapp: 'bg-[#22C55E]',
  email: 'bg-[#2563EB]',
}

export function InboxMockup() {
  return (
    <div className="w-full max-w-[580px] mx-auto lg:mx-0 lg:max-w-none">
      <div className="rounded-[12px] border border-[#E5E3DF] bg-white shadow-xl overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F3F4F6] border-b border-[#E5E3DF]">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FCA5A5]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FCD34D]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />
          </div>
          <div className="flex-1 bg-white rounded-[6px] px-3 py-1 text-[11px] text-[#9CA3AF] truncate">
            {APP_URL.replace('https://', '')}/inbox
          </div>
        </div>

        {/* App UI */}
        <div className="flex h-[340px] sm:h-[380px]">
          {/* Sidebar */}
          <aside className="hidden sm:flex flex-col w-[140px] lg:w-[160px] bg-[#1C1917] flex-shrink-0">
            <div className="px-3 py-3 border-b border-white/10">
              <span className="text-white text-xs font-semibold">{APP_NAME}</span>
              <p className="text-[10px] text-white/40 mt-0.5 truncate">Casa del Sol</p>
            </div>
            <nav className="px-2 py-3 space-y-0.5">
              <NavItem label="Inbox" active badge={2} />
              <NavItem label="Guests" />
              <NavItem label="Automations" />
            </nav>
          </aside>

          {/* Inbox panel */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#F8F7F4]">
            <div className="px-3 py-2.5 bg-white border-b border-[#E5E3DF]">
              <p className="text-xs font-semibold text-[#111827]">Inbox</p>
              <div className="flex gap-1 mt-1.5">
                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#EFF6FF] text-[#2563EB]">
                  All
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded text-[#9CA3AF]">
                  Open
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {CONVERSATIONS.map((c) => (
                <div
                  key={c.name}
                  className={`px-3 py-2.5 border-b border-[#E5E3DF] ${
                    c.active ? 'bg-[#EFF6FF] border-l-[3px] border-l-[#2563EB] pl-[9px]' : 'bg-white border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                          c.unread ? 'bg-[#2563EB]' : 'opacity-0'
                        }`}
                      />
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${CHANNEL_COLORS[c.channel]}`} />
                      <span className="text-[11px] font-semibold text-[#111827] truncate">{c.name}</span>
                    </div>
                    <span className="text-[10px] text-[#6B7280] flex-shrink-0">Rm {c.room}</span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] truncate mt-1 pl-4">{c.preview}</p>
                  <div className="flex items-center justify-between mt-1 pl-4">
                    <span className="text-[9px] text-[#9CA3AF]">{c.time}</span>
                    <div className="flex gap-1">
                      {c.status === 'in_progress' && (
                        <span className="px-1 py-0.5 text-[8px] font-medium rounded bg-[#FEF3C7] text-[#92400E]">
                          In progress
                        </span>
                      )}
                      {c.urgent && (
                        <span className="px-1 py-0.5 text-[8px] font-semibold rounded bg-[#FEF2F2] text-[#DC2626]">
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({
  label,
  active,
  badge,
}: {
  label: string
  active?: boolean
  badge?: number
}) {
  return (
    <div
      className={`flex items-center justify-between px-2 py-1.5 rounded-[6px] text-[10px] font-medium ${
        active ? 'bg-white/10 text-white' : 'text-white/50'
      }`}
    >
      <span>{label}</span>
      {badge != null && (
        <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-[#2563EB] text-white">{badge}</span>
      )}
    </div>
  )
}
