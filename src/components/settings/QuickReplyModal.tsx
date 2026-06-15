import { useEffect, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { QUICK_REPLY_VARIABLES } from '../../lib/settingsConstants'
import type { QuickReply } from '../../types'

interface QuickReplyModalProps {
  open: boolean
  reply?: QuickReply | null
  onClose: () => void
  onSubmit: (name: string, message: string) => Promise<void>
}

export function QuickReplyModal({ open, reply, onClose, onSubmit }: QuickReplyModalProps) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(reply?.name ?? '')
      setMessage(reply?.message ?? '')
    }
  }, [open, reply])

  function insertVariable(variable: string) {
    setMessage((prev) => (prev ? `${prev} ${variable}` : variable))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setLoading(true)
    try {
      await onSubmit(name.trim(), message.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reply ? 'Edit Quick Reply' : 'Add Quick Reply'}
      width="520px"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder='e.g. "WiFi Details"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-message" className="text-sm font-medium text-[#111827]">
            Message
          </label>
          <textarea
            id="qr-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E3DF] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
          />
        </div>
        <div>
          <p className="text-xs font-medium text-[#6B7280] mb-2">Insert variable</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLY_VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="px-2 py-1 text-xs font-medium bg-[#F3F4F6] text-[#374151] rounded-[6px] hover:bg-[#E5E7EB] transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {reply ? 'Save changes' : 'Add quick reply'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
