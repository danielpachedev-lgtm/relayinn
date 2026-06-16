import { authenticateHotel, corsHeaders, jsonResponse } from '../_shared/stripe-helpers.ts'

interface MetaPhoneNumber {
  id: string
  display_phone_number?: string
  verified_name?: string
}

function requireMetaAppCredentials() {
  const appId = Deno.env.get('META_APP_ID')
  const appSecret = Deno.env.get('META_APP_SECRET')
  if (!appId || !appSecret) {
    throw new Error('Meta app credentials not configured')
  }
  return { appId, appSecret }
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const { appId, appSecret } = requireMetaAppCredentials()
  const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('code', code)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message ?? 'Failed to exchange authorization code')
  }

  return data.access_token as string
}

async function graphGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`https://graph.facebook.com/v18.0/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Meta API error (${path})`)
  }
  return data as T
}

async function findWabaAndPhone(accessToken: string): Promise<{
  wabaId: string
  phone: MetaPhoneNumber
}> {
  const businesses = await graphGet<{ data?: { id: string }[] }>(
    'me/businesses?fields=id,name',
    accessToken
  )

  for (const business of businesses.data ?? []) {
    const wabas = await graphGet<{ data?: { id: string }[] }>(
      `${business.id}/owned_whatsapp_business_accounts?fields=id,name`,
      accessToken
    )

    for (const waba of wabas.data ?? []) {
      const phones = await graphGet<{ data?: MetaPhoneNumber[] }>(
        `${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name`,
        accessToken
      )

      if (phones.data?.length) {
        return { wabaId: waba.id, phone: phones.data[0] }
      }
    }
  }

  throw new Error('No WhatsApp Business phone number found for this account')
}

async function subscribeWabaWebhooks(wabaId: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/subscribed_apps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'Failed to subscribe app to WhatsApp webhooks')
  }
}

function normalizeDisplayPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  return digits ? `+${digits}` : phone
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
  }

  try {
    const auth = await authenticateHotel(req)
    if (!auth) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401)
    }

    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return jsonResponse({ success: false, error: 'Authorization code is required' }, 400)
    }

    const accessToken = await exchangeCodeForToken(code)
    const { wabaId, phone } = await findWabaAndPhone(accessToken)
    await subscribeWabaWebhooks(wabaId, accessToken)

    const displayPhone = phone.display_phone_number
      ? normalizeDisplayPhone(phone.display_phone_number)
      : null

    const { data: hotel, error: updateErr } = await auth.admin
      .from('hotels')
      .update({
        whatsapp_connected: true,
        whatsapp_phone: displayPhone,
        whatsapp_phone_number_id: phone.id,
        meta_access_token: accessToken,
        meta_waba_id: wabaId,
      })
      .eq('id', auth.hotel.id)
      .select(
        'id, name, email, phone, plan, website, address, timezone, default_language, whatsapp_phone, whatsapp_phone_number_id, whatsapp_connected, meta_waba_id, stripe_customer_id, stripe_subscription_id, trial_ends_at, subscription_status, current_period_end, created_at'
      )
      .single()

    if (updateErr || !hotel) {
      console.error('[meta-exchange-token] Hotel update failed:', updateErr)
      return jsonResponse({ success: false, error: 'Failed to save WhatsApp connection' }, 500)
    }

    return jsonResponse({
      success: true,
      phone: displayPhone,
      hotel,
    })
  } catch (err) {
    console.error('[meta-exchange-token] Error:', err)
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      500
    )
  }
})
