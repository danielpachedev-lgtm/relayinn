import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { supabase } from '../../lib/supabase'
import { sendAutomationToGuest } from '../../lib/automationService'
import { useHotelStore } from '../../store/hotelStore'
import { useInboxStore } from '../../store/inboxStore'
import type { Automation, Guest } from '../../types'

interface TestAutomationModalProps {
  open: boolean
  automation: Automation | null
  onClose: () => void
  onSent: () => void
}

export function TestAutomationModal({
  open,
  automation,
  onClose,
  onSent,
}: TestAutomationModalProps) {
  const { currentHotel } = useHotelStore()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !currentHotel) return
    setLoading(true)
    setSelectedId(null)
    supabase
      .from('guests')
      .select('*')
      .eq('hotel_id', currentHotel.id)
      .order('name')
      .then(({ data }) => {
        setGuests((data ?? []) as Guest[])
        setLoading(false)
      })
  }, [open, currentHotel?.id])

  async function handleSend() {
    if (!automation || !currentHotel || !selectedId) return
    const guest = guests.find((g) => g.id === selectedId)
    if (!guest) return

    setSending(true)
    try {
      const { conversationId, message } = await sendAutomationToGuest(
        automation,
        guest,
        currentHotel,
        { skipDedup: true }
      )
      const { clearMessages, updateConversation } = useInboxStore.getState()
      clearMessages(conversationId)
      const now = new Date().toISOString()
      updateConversation(conversationId, {
        last_message_at: now,
        last_message: {
          id: 'pending',
          content: message,
          sender_type: 'system',
          read_at: null,
          created_at: now,
        },
      })
      toast.success(`Test message sent to ${guest.name}`)
      onSent()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send test message" width="420px">
      <p className="text-sm text-[#6B7280] mb-4">
        Pick a guest to preview what they would receive from{' '}
        <span className="font-medium text-[#111827]">{automation?.name}</span>.
      </p>

      {loading ? (
        <div className="space-y-2 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#F3F4F6] rounded-[8px] animate-pulse" />
          ))}
        </div>
      ) : guests.length === 0 ? (
        <p className="text-sm text-[#9CA3AF] italic mb-4">No guests found. Add a guest first.</p>
      ) : (
        <div className="max-h-48 overflow-y-auto border border-[#E5E3DF] rounded-[8px] mb-4 divide-y divide-[#E5E3DF]">
          {guests.map((guest) => (
            <button
              key={guest.id}
              type="button"
              onClick={() => setSelectedId(guest.id)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                selectedId === guest.id
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-medium'
                  : 'text-[#111827] hover:bg-[#F8F7F4]'
              }`}
            >
              <span>{guest.name}</span>
              {guest.room_number && (
                <span className="text-[#9CA3AF] ml-2">Rm {guest.room_number}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button onClick={handleSend} loading={sending} disabled={!selectedId}>
          Send test
        </Button>
      </div>
    </Modal>
  )
}
