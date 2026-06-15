import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'
import {
  getPlanFromPriceId,
  getStripe,
  mapStripeSubscriptionStatus,
} from '../_shared/stripe-helpers.ts'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const stripe = getStripe()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET missing')
    return new Response('Server misconfigured', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription && session.customer) {
          await admin
            .from('hotels')
            .update({
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
            })
            .eq('stripe_customer_id', session.customer as string)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price?.id
        const plan = priceId ? getPlanFromPriceId(priceId) : 'starter'
        const status = mapStripeSubscriptionStatus(subscription.status)
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null

        await admin
          .from('hotels')
          .update({
            subscription_status: status,
            plan,
            current_period_end: periodEnd,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await admin
          .from('hotels')
          .update({
            subscription_status: 'canceled',
            plan: 'starter',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          await admin
            .from('hotels')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer as string)
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err)
    return new Response('Webhook handler failed', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
