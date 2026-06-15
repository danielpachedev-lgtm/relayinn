import { useState, useRef, useEffect } from 'react'

interface GuestKebabMenuProps {
  onEdit: () => void
  onDelete: () => void
}

export function GuestKebabMenu({ onEdit, onDelete }: GuestKebabMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-[6px] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-colors"
        aria-label="More actions"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-[8px] border border-[#E5E3DF] shadow-lg z-20 py-1 overflow-hidden">
          <button
            onClick={() => { onEdit(); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-[13px] text-[#111827] hover:bg-[#F8F7F4] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full text-left px-3 py-2 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
