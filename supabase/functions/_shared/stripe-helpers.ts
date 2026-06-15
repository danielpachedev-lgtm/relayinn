import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function getStripe(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY')
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(key, {
    apiVersion: '2024-11-20.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  })
}

export function getAppUrl(): string {
  return (Deno.env.get('APP_URL') ?? 'http://localhost:5173').replace(/\/$/, '')
}

/** Prefer client-sent appUrl (from VITE_APP_URL), validated against an allowlist. */
export function resolveAppUrl(requested?: string | null): string {
  const fallback = getAppUrl()
  if (!requested || typeof requested !== 'string') return fallback

  try {
    const origin = new URL(requested).origin
    const allowed =
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https:\/\/relayinn\.vercel\.app$/.test(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
      /^https:\/\/app\.relayinn\.com$/.test(origin)

    if (allowed) return origin
  } catch {
    // invalid URL — use fallback
  }

  return fallback
}

export function getPlanFromPriceId(priceId: string): string {
  const starter = Deno.env.get('STRIPE_PRICE_STARTER')
  const pro = Deno.env.get('STRIPE_PRICE_PRO')
  if (priceId === starter) return 'starter'
  if (priceId === pro) return 'pro'
  return 'starter'
}

export function mapStripeSubscriptionStatus(status: string): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return status
  }
}

export async function authenticateHotel(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: staff } = await admin
    .from('staff')
    .select('hotel_id')
    .eq('user_id', user.id)
    .single()

  if (!staff) return null

  const { data: hotel } = await admin
    .from('hotels')
    .select('*')
    .eq('id', staff.hotel_id)
    .single()

  if (!hotel) return null

  return { admin, hotel, user }
}
