export function normalizePhone(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const withoutPrefix = trimmed.replace(/^whatsapp:/i, '')
  const digits = withoutPrefix.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (digits.startsWith('00')) return `+${digits.slice(2)}`
  return `+${digits}`
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

export function toWhatsAppAddress(phone: string): string {
  const normalized = normalizePhone(phone)
  return normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`
}
