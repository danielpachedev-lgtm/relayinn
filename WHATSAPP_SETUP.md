# WhatsApp Setup for RelayInn

RelayInn uses the **Meta WhatsApp Business Cloud API** with **Embedded Signup** so each hotel connects their own WhatsApp Business number in Settings — no manual setup from RelayInn staff.

## Prerequisites

- A [Meta Developer](https://developers.facebook.com/) app with WhatsApp product enabled
- Supabase CLI linked to your project (`vpeagsczoyizqevozrlb`)
- Embedded Signup configuration created in Meta Dashboard

## Supabase secrets

```bash
supabase secrets set META_APP_ID=your_app_id
supabase secrets set META_APP_SECRET=your_app_secret
supabase secrets set META_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

Legacy sandbox secrets (`META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`) are optional fallbacks for hotels connected before Embedded Signup.

> **Security:** Never commit access tokens to git. Per-hotel tokens are stored in `hotels.meta_access_token` (server-side only).

## Frontend environment variables

Add to `.env` (and Vercel):

```env
VITE_META_APP_ID=your_app_id
VITE_META_CONFIG_ID=your_embedded_signup_config_id
```

## Database migrations

```bash
supabase db push
```

- `013_meta_whatsapp.sql` — `whatsapp_phone_number_id`
- `014_meta_embedded_signup.sql` — `meta_access_token`, `meta_waba_id`

## Deploy edge functions

```bash
supabase functions deploy meta-whatsapp-webhook --no-verify-jwt
supabase functions deploy send-meta-whatsapp --no-verify-jwt
supabase functions deploy meta-exchange-token --no-verify-jwt
```

> **Important:** Webhook and token exchange endpoints use `--no-verify-jwt` because Meta webhooks have no JWT, and auth is verified inside each function.

## Embedded Signup Setup

### In Meta Developer Console

1. Go to your RelayInn app → **WhatsApp** → **Embedded Signup**
2. Create a new configuration
3. Copy the **Config ID** → add to `.env` as `VITE_META_CONFIG_ID`
4. Set allowed domains:
   - `https://relayinn.vercel.app`
   - `http://localhost:5173`

### Configure app webhook (once per RelayInn app)

1. Go to **WhatsApp** → **Configuration**
2. **Callback URL:** `https://vpeagsczoyizqevozrlb.supabase.co/functions/v1/meta-whatsapp-webhook`
3. **Verify token:** same value as `META_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to **messages**

When a hotel completes Embedded Signup, RelayInn also calls `POST /{wabaId}/subscribed_apps` to subscribe that WABA to your app.

## How it works

1. Hotel clicks **Connect with WhatsApp** in Settings
2. Meta Embedded Signup popup opens (Facebook Login)
3. Hotel selects their WhatsApp Business account and number
4. Meta returns an authorization code to RelayInn
5. `meta-exchange-token` exchanges the code for a permanent access token
6. RelayInn saves `meta_access_token`, `whatsapp_phone_number_id`, and `meta_waba_id` for that hotel
7. Inbound messages are routed by `metadata.phone_number_id` in the webhook
8. Outbound messages use each hotel's own token via `send-meta-whatsapp`

## Test Embedded Signup

1. Add `VITE_META_APP_ID` and `VITE_META_CONFIG_ID` to `.env`
2. Go to **Settings → Integrations → WhatsApp**
3. Click **Connect with WhatsApp**
4. Complete the Meta popup with a test WhatsApp Business account
5. Verify in Supabase: `hotels.whatsapp_phone_number_id` and `meta_access_token` are set
6. Send a WhatsApp to the hotel's number → appears in inbox
7. Reply from inbox → arrives on guest's phone

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "WhatsApp signup is not configured" | Set `VITE_META_CONFIG_ID` in `.env` / Vercel |
| Meta popup doesn't open | Check `VITE_META_APP_ID` and allowed domains in Meta Dashboard |
| Token exchange fails | Verify `META_APP_ID` and `META_APP_SECRET` Supabase secrets |
| No WABA found | Ensure the Meta account has a WhatsApp Business number linked |
| Messages not routed | Confirm `whatsapp_phone_number_id` matches webhook `metadata.phone_number_id` |
| Send fails | Hotel must complete Embedded Signup so `meta_access_token` is saved |
