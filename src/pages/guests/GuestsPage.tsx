import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useGuests } from '../../hooks/useGuests'
import { useHotelStore } from '../../store/hotelStore'
import { GuestsTable, type StayFilter } from '../../components/guests/GuestsTable'
import { GuestFormModal } from '../../components/guests/GuestFormModal'
import { GuestDetailPanel } from '../../components/guests/GuestDetailPanel'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Button } from '../../components/ui/Button'
import {
  createGuest,
  updateGuest,
  deleteGuest,
  type GuestFormData,
} from '../../lib/guestService'
import { getGuestStayStatus } from '../../lib/guestUtils'
import type { Guest, GuestWithMeta } from '../../types'

const STAY_FILTERS: { id: StayFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'arriving', label: 'Arriving' },
  { id: 'in_house', label: 'In House' },
  { id: 'checked_out', label: 'Checked Out' },
  { id: 'upcoming', label: 'Upcoming' },
]

export function GuestsPage() {
  const navigate = useNavigate()
  const { currentHotel } = useHotelStore()
  const { guests, loading, reload } = useGuests()

  const [search, setSearch] = useState('')
  const [stayFilter, setStayFilter] = useState<StayFilter>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

  const [detailGuest, setDetailGuest] = useState<Guest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<GuestWithMeta | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guests.filter((guest) => {
      const status = getGuestStayStatus(guest.check_in, guest.check_out)
      if (stayFilter !== 'all' && status !== stayFilter) return false

      if (!q) return true
      return (
        guest.name.toLowerCase().includes(q) ||
        (guest.email?.toLowerCase().includes(q) ?? false) ||
        (guest.room_number?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [guests, search, stayFilter])

  function openAddModal() {
    setFormMode('add')
    setEditingGuest(null)
    setFormOpen(true)
  }

  function openEditModal(guest: GuestWithMeta) {
    setFormMode('edit')
    setEditingGuest(guest)
    setFormOpen(true)
  }

  function openDetail(guest: GuestWithMeta) {
    setDetailGuest(guest)
    setDetailOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
  }

  async function handleFormSubmit(data: GuestFormData) {
    if (!currentHotel) return
    if (formMode === 'add') {
      await createGuest(currentHotel.id, data)
      toast.success('Guest added successfully')
    } else if (editingGuest) {
      const updated = await updateGuest(editingGuest.id, data)
      if (detailGuest?.id === updated.id) setDetailGuest(updated)
      toast.success('Guest updated')
    }
    reload()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGuest(deleteTarget.id)
      toast.success('Guest deleted')
      if (detailGuest?.id === deleteTarget.id) {
        setDetailOpen(false)
        setDetailGuest(null)
      }
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete guest')
    } finally {
      setDeleting(false)
    }
  }

  function handleConversationsClick(guest: GuestWithMeta) {
    navigate(`/inbox?guest=${guest.id}`)
  }

  function handleGuestUpdated(updated: Guest) {
    setDetailGuest(updated)
    reload()
  }

  const showEmpty = !loading && guests.length === 0

  return (
    <div className="h-full overflow-y-auto bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold text-[#111827]">Guests</h1>
          {!showEmpty && (
            <Button onClick={openAddModal}>Add Guest</Button>
          )}
        </div>

        {showEmpty ? (
          <EmptyState onAddGuest={openAddModal} />
        ) : (
          <>
            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or room…"
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E3DF] rounded-[8px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent shadow-sm"
                />
              </div>
              <select
                value={stayFilter}
                onChange={(e) => setStayFilter(e.target.value as StayFilter)}
                className="px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E3DF] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-sm min-w-[160px]"
              >
                {STAY_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {filteredGuests.length === 0 && !loading ? (
              <div className="bg-white rounded-[12px] border border-[#E5E3DF] shadow-sm py-12 text-center">
                <p className="text-sm text-[#6B7280]">No guests match your search or filter.</p>
              </div>
            ) : (
              <GuestsTable
                guests={filteredGuests}
                loading={loading}
                onView={openDetail}
                onEdit={openEditModal}
                onDelete={setDeleteTarget}
                onConversationsClick={handleConversationsClick}
              />
            )}
          </>
        )}
      </div>

      <GuestFormModal
        open={formOpen}
        mode={formMode}
        guest={editingGuest}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {detailGuest && (
        <GuestDetailPanel
          guest={detailGuest}
          isOpen={detailOpen}
          onClose={closeDetail}
          onGuestUpdated={handleGuestUpdated}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete guest?"
        message="Are you sure? This will delete all conversations and messages for this guest."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function EmptyState({ onAddGuest }: { onAddGuest: () => void }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E5E3DF] shadow-sm py-16 px-6 text-center">
      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
        <svg className="h-8 w-8 text-[#16A34A]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-[#111827]">No guests yet</h2>
      <p className="text-sm text-[#6B7280] mt-1 mb-6 max-w-sm mx-auto">
        No guests yet. Add your first guest to get started.
      </p>
      <Button onClick={onAddGuest}>Add Guest</Button>
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
