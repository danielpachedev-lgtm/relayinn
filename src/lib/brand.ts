/** Central branding constants — single source of truth for RelayInn */
export const APP_NAME = 'RelayInn'
export const APP_DOMAIN = 'relayinn.com'
export const SUPPORT_EMAIL = `support@${APP_DOMAIN}`

/** Public app URL — set VITE_APP_URL in .env / Vercel (e.g. https://relayinn.vercel.app) */
export const APP_URL = (
  import.meta.env.VITE_APP_URL as string | undefined
)?.replace(/\/$/, '') ?? (import.meta.env.DEV ? 'http://localhost:5173' : 'https://relayinn.vercel.app')
