import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHotelStore } from '../../store/hotelStore'
import { connectWhatsApp, disconnectWhatsApp, sendTestWhatsApp } from '../../lib/settingsService'

const COMING_SOON = [
  { icon: '📧', name: 'Email', desc: 'Gmail / Outlook' },
  { icon: '📸', name: 'Instagram DMs', desc: 'Direct messages' },
  { icon: '🏨', name: 'Cloudbeds PMS', desc: 'Property management' },
  { icon: '🏨', name: 'Little Hotelier PMS', desc: 'Property management' },
  { icon: '📊', name: 'Google Reviews', desc: 'Review monitoring' },
]

const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/

export function IntegrationsSection() {
  const { currentHotel, currentStaff, setHotel } = useHotelStore()
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  if (!currentHotel) return null

  const connected = currentHotel.whatsapp_connected ?? false

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const updated = await disconnectWhatsApp(currentHotel!.id)
      setHotel(updated)
      toast.success('WhatsApp disconnected')
      setDisconnectOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  async function handleTestMessage() {
    if (!currentHotel?.whatsapp_phone || !currentStaff) {
      toast.error('Hotel WhatsApp number or staff session missing')
      return
    }
    setSendingTest(true)
    try {
      await sendTestWhatsApp(
        currentHotel.id,
        currentHotel.whatsapp_phone,
        currentStaff.id
      )
      toast.success('Test message sent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test message')
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-[#111827] mb-1">Integrations</h2>
      <p className="text-sm text-[#6B7280] mb-6">
        Connect channels and tools to your hotel inbox.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-[10px] border border-[#E5E3DF] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">WhatsApp Business</h3>
                <p className="text-xs text-[#6B7280]">Receive guest messages in your inbox</p>
              </div>
            </div>
            <StatusBadge connected={connected} />
          </div>

          {connected ? (
            <ConnectedView
              number={currentHotel.whatsapp_phone}
              onTest={handleTestMessage}
              testing={sendingTest}
              onDisconnect={() => setDisconnectOpen(true)}
            />
          ) : (
            <ConnectForm
              hotelId={currentHotel.id}
              onConnected={(hotel) => setHotel(hotel)}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMING_SOON.map((item) => (
            <div
              key={item.name}
              className="bg-[#F9FAFB] rounded-[10px] border border-[#E5E3DF] p-4 opacity-60"
            >
              <div className="flex items-start justify-between">
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#E5E7EB] text-[#6B7280]">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm font-medium text-[#111827] mt-2">{item.name}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={disconnectOpen}
        title="Disconnect WhatsApp"
        message="Are you sure you want to disconnect WhatsApp? You will stop receiving messages until you set it up again."
        confirmLabel="Disconnect"
        loading={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectOpen(false)}
      />
    </div>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        connected ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${connected ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
      {connected ? 'Connected' : 'Not Connected'}
    </span>
  )
}

function ConnectedView({
  number,
  onTest,
  testing,
  onDisconnect,
}: {
  number: string | null
  onTest: () => void
  testing: boolean
  onDisconnect: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6B7280]">
        WhatsApp number: <span className="font-medium text-[#111827]">{number ?? '—'}</span>
      </p>
      <div className="flex gap-2">
        <Button onClick={onTest} loading={testing} variant="secondary">
          Send test message
        </Button>
        <Button variant="danger" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    </div>
  )
}

function ConnectForm({
  hotelId,
  onConnected,
}: {
  hotelId: string
  onConnected: (hotel: import('../../types').Hotel) => void
}) {
  const [phone, setPhone] = useState('')
  const [connecting, setConnecting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!PHONE_PATTERN.test(phone.trim())) {
      toast.error('Enter a valid number in format +1234567890')
      return
    }
    setConnecting(true)
    try {
      const updated = await connectWhatsApp(hotelId, phone)
      onConnected(updated)
      toast.success('WhatsApp connected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h4 className="text-sm font-semibold text-[#111827]">Connect your WhatsApp Business</h4>
      <Input
        label="WhatsApp phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1234567890"
        required
      />
      <Button type="submit" loading={connecting}>
        Connect WhatsApp
      </Button>
    </form>
  )
}
