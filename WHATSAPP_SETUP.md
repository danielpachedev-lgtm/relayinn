# WhatsApp Setup for RelayInn

RelayInn uses a **single shared Twilio account** for all hotels. Hotels only register their WhatsApp number in Settings — no Twilio credentials are stored per hotel.

## Prerequisites

- A [Twilio account](https://www.twilio.com/try-twilio)
- Supabase CLI linked to your project
- Twilio WhatsApp Sandbox enabled (for testing) or a purchased WhatsApp Business number

## Environment variables

Set these as **Supabase edge function secrets** (required for production):

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxx
supabase secrets set TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

For local reference, add the same values to `.env.local` (not committed):

```env
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Deploy edge functions

```bash
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy send-whatsapp
```

> **Important:** `whatsapp-webhook` must be deployed with `--no-verify-jwt` because Twilio sends requests without a Supabase JWT. Security is enforced via Twilio request signature validation (`X-Twilio-Signature`).

## Configure Twilio webhook

In **Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings**:

| Setting | Value |
|---------|-------|
| When a message comes in | `https://[your-project-ref].supabase.co/functions/v1/whatsapp-webhook` |
| Method | HTTP POST |

Replace `[your-project-ref]` with your Supabase project reference (e.g. `vpeagsczoyizqevozrlb`).

## How it works

1. Guest sends WhatsApp to the Twilio number
2. Twilio POSTs to `whatsapp-webhook`
3. Webhook looks up the guest by phone, finds or creates a conversation
4. Message is saved with `sender_type='guest'`
5. Inbox real-time subscription shows the message instantly
6. Staff replies → frontend calls `send-whatsapp`
7. Edge function sends via Twilio API and saves the staff message

## Test the flow

1. In Twilio Sandbox, send `join <your-sandbox-keyword>` from your personal WhatsApp to opt in
2. From your personal WhatsApp, send a message to the Twilio sandbox number
3. The message should appear in RelayInn inbox within seconds
4. Reply from the inbox — it should arrive on your WhatsApp
5. In **Settings → Integrations → WhatsApp**, use **Send test message** to verify the hotel number receives messages

## Twilio Sandbox limitations

- Guests must opt in by sending `join [sandbox-keyword]` before you can message them
- Sandbox numbers are for development only
- For production: upgrade to a real WhatsApp Business number in Twilio

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook returns 403 | Check `TWILIO_AUTH_TOKEN` matches your Twilio console |
| Messages not appearing | Confirm webhook URL is correct and function is deployed with `--no-verify-jwt` |
| Send fails "Guest has no phone" | Add a phone number to the guest record (E.164 format, e.g. `+34612345678`) |
| Send fails "Too many messages" | Twilio rate limit — wait and retry |
| Test message not received | Ensure your number has joined the Twilio sandbox |
