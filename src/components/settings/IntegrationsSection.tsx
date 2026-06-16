import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useHotelStore } from '../../store/hotelStore'
import { disconnectWhatsApp, exchangeMetaWhatsAppCode, sendTestWhatsApp } from '../../lib/settingsService'
import { launchWhatsAppEmbeddedSignup } from '../../lib/metaSdk'

const COMING_SOON = [
  { icon: '📧', name: 'Email', desc: 'Gmail / Outlook' },
  { icon: '📸', name: 'Instagram DMs', desc: 'Direct messages' },
  { icon: '🏨', name: 'Cloudbeds PMS', desc: 'Property management' },
  { icon: '🏨', name: 'Little Hotelier PMS', desc: 'Property management' },
  { icon: '📊', name: 'Google Reviews', desc: 'Review monitoring' },
]

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
            <ConnectEmbeddedSignup onConnected={(hotel) => setHotel(hotel)} />
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

function ConnectEmbeddedSignup({
  onConnected,
}: {
  onConnected: (hotel: import('../../types').Hotel) => void
}) {
  const [connecting, setConnecting] = useState(false)

  async function handleConnect() {
    setConnecting(true)
    try {
      const code = await launchWhatsAppEmbeddedSignup()
      const hotel = await exchangeMetaWhatsAppCode(code)
      onConnected(hotel)
      toast.success('WhatsApp connected successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect WhatsApp'
      if (!message.toLowerCase().includes('cancelled')) {
        toast.error(message)
      }
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <h4 className="text-sm font-semibold text-[#111827]">Connect your WhatsApp Business</h4>
      <p className="text-sm text-[#6B7280]">
        Connect your existing WhatsApp Business number in under 5 minutes. Your guests keep
        messaging your usual number.
      </p>

      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[13px] font-semibold bg-[#16A34A] text-white hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {connecting ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <WhatsAppIcon />
        )}
        Connect with WhatsApp
      </button>

      <ul className="space-y-1.5 text-sm text-[#6B7280]">
        <li className="flex items-center gap-2">
          <span className="text-[#16A34A]">✓</span> Keep your existing WhatsApp number
        </li>
        <li className="flex items-center gap-2">
          <span className="text-[#16A34A]">✓</span> No technical setup required
        </li>
        <li className="flex items-center gap-2">
          <span className="text-[#16A34A]">✓</span> Takes less than 5 minutes
        </li>
      </ul>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
