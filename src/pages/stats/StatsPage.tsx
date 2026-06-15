export function StatsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#E5E3DF] bg-white">
        <h1 className="text-lg font-semibold text-[#111827]">Stats</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">Performance and response metrics</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[#F5F3FF] flex items-center justify-center">
            <svg className="h-7 w-7 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-[#111827]">Stats coming soon</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Response times, message volume, and guest satisfaction scores will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
