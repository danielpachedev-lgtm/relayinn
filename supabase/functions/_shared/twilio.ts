const encoder = new TextEncoder()

export function getTwilioEnv() {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const whatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')
  return { accountSid, authToken, whatsappNumber }
}

export function requireTwilioEnv() {
  const env = getTwilioEnv()
  if (!env.accountSid || !env.authToken || !env.whatsappNumber) {
    throw new Error('Twilio credentials not configured')
  }
  return env as { accountSid: string; authToken: string; whatsappNumber: string }
}

export async function validateTwilioSignature(
  authToken: string,
  signature: string | null,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  if (!signature) return false

  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) {
    data += key + params[key]
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
  return expected === signature
}

export async function sendTwilioWhatsApp(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<{ sid: string }> {
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    }
  )

  const result = await res.json()

  if (!res.ok) {
    const message = result?.message ?? `Twilio error (${res.status})`
    const err = new Error(message) as Error & { status?: number }
    err.status = res.status
    throw err
  }

  return { sid: result.sid as string }
}

export const TWIML_EMPTY_RESPONSE = `<?xml version="1.0" encoding="UTF-8"?>\n<Response></Response>`

export const twimlHeaders = { 'Content-Type': 'text/xml' }
