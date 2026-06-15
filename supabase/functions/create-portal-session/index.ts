import {
  authenticateHotel,
  corsHeaders,
  getStripe,
  jsonResponse,
  resolveAppUrl,
} from '../_shared/stripe-helpers.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const auth = await authenticateHotel(req)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401)

    const { hotel } = auth
    const body = await req.json().catch(() => ({}))
    const customerId = hotel.stripe_customer_id as string | null

    if (!customerId) {
      return jsonResponse({ error: 'No billing account found. Subscribe to a plan first.' }, 400)
    }

    const stripe = getStripe()
    const appUrl = resolveAppUrl(body.appUrl)

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings?section=billing`,
    })

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error('[create-portal-session]', err)
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Portal session failed' },
      500
    )
  }
})
