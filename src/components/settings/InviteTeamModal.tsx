import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { FormSelect } from './FormSelect'

interface InviteTeamModalProps {
  open: boolean
  onClose: () => void
}

export function InviteTeamModal({ open, onClose }: InviteTeamModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')

  function reset() {
    setName('')
    setEmail('')
    setRole('staff')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required')
      return
    }
    const registerUrl = `${window.location.origin}/register`
    toast.success(
      `Ask ${name.trim()} to register at ${registerUrl} with this email: ${email.trim()}`,
      { duration: 8000 }
    )
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite Team Member" width="440px">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormSelect
          label="Role"
          value={role}
          onChange={(v) => setRole(v as 'manager' | 'staff')}
          options={[
            { value: 'manager', label: 'Manager' },
            { value: 'staff', label: 'Staff' },
          ]}
        />
        <p className="text-xs text-[#6B7280]">
          They will need to create an account with the email above. Once registered, add them
          manually or contact support to link their account.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Send invite</Button>
        </div>
      </form>
    </Modal>
  )
}
