import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Link } from 'react-router-dom'

interface UpgradeLimitModalProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
}

export function UpgradeLimitModal({ open, onClose, title, message }: UpgradeLimitModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="420px">
      <p className="text-sm text-[#6B7280] leading-relaxed mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Link
          to="/settings?section=billing"
          onClick={onClose}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-[8px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
        >
          View plans
        </Link>
      </div>
    </Modal>
  )
}
