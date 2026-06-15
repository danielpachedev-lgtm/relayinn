import { supabase } from './supabase'
import { APP_URL } from './brand'

export async function createCheckoutSession(priceId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, appUrl: APP_URL },
  })

  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error(data?.error ?? 'Failed to create checkout session')
  return data.url as string
}

export async function createPortalSession(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: { appUrl: APP_URL },
  })

  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error(data?.error ?? 'Failed to open billing portal')
  return data.url as string
}

export async function redirectToCheckout(priceId: string): Promise<void> {
  const url = await createCheckoutSession(priceId)
  window.location.href = url
}

export async function redirectToPortal(): Promise<void> {
  const url = await createPortalSession()
  window.location.href = url
}
