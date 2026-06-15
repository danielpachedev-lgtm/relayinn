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

    const { admin, hotel } = auth
    const { priceId, appUrl: requestedAppUrl } = await req.json()

    if (!priceId) {
      return jsonResponse({ error: 'priceId is required' }, 400)
    }

    const stripe = getStripe()
    const appUrl = resolveAppUrl(requestedAppUrl)

    let customerId = hotel.stripe_customer_id as string | null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: hotel.email ?? undefined,
        name: hotel.name,
        metadata: { hotel_id: hotel.id },
      })
      customerId = customer.id

      await admin
        .from('hotels')
        .update({ stripe_customer_id: customerId })
        .eq('id', hotel.id)
    }

    const sessionParams: Record<string, unknown> = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?section=billing&success=true`,
      cancel_url: `${appUrl}/settings?section=billing&canceled=true`,
      metadata: { hotel_id: hotel.id },
    }

    if (hotel.trial_ends_at) {
      const trialEnd = new Date(hotel.trial_ends_at as string)
      if (trialEnd > new Date()) {
        sessionParams.subscription_data = {
          trial_end: Math.floor(trialEnd.getTime() / 1000),
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return jsonResponse({ url: session.url })
  } catch (err) {
    console.error('[create-checkout-session]', err)
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      500
    )
  }
})
