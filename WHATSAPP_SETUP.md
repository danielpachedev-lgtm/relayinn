# WhatsApp Setup for RelayInn

RelayInn uses the **Meta WhatsApp Business Cloud API**. Credentials are stored as Supabase edge function secrets — hotels register their test recipient phone and Meta Phone Number ID in Settings.

## Prerequisites

- A [Meta Developer](https://developers.facebook.com/) app with WhatsApp product enabled
- Supabase CLI linked to your project (`vpeagsczoyizqevozrlb`)
- A test phone number added as a recipient in Meta Dashboard

## Supabase secrets

```bash
supabase secrets set META_APP_ID=your_app_id
supabase secrets set META_PHONE_NUMBER_ID=your_phone_number_id
supabase secrets set META_WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
supabase secrets set META_ACCESS_TOKEN=your_access_token
supabase secrets set META_WEBHOOK_VERIFY_TOKEN=your_verify_token
supabase secrets set META_APP_SECRET=your_app_secret
```

> **Security:** Never commit access tokens to git. Rotate tokens if they are ever exposed.

## Database migration

```bash
supabase db push
```

This adds `whatsapp_phone_number_id` to the `hotels` table (migration `013_meta_whatsapp.sql`).

## Deploy edge functions

```bash
supabase functions deploy meta-whatsapp-webhook --no-verify-jwt
supabase functions deploy send-meta-whatsapp
```

> **Important:** `meta-whatsapp-webhook` must be deployed with `--no-verify-jwt` because Meta sends webhook requests without a Supabase JWT. Security is enforced via `X-Hub-Signature-256` validation using `META_APP_SECRET`.

## Configure Meta webhook

After deploying `meta-whatsapp-webhook`:

1. Go to [developers.facebook.com](https://developers.facebook.com) → your app → **WhatsApp** → **Configuration**
2. In the **Webhooks** section:
   - **Callback URL:** `https://vpeagsczoyizqevozrlb.supabase.co/functions/v1/meta-whatsapp-webhook`
   - **Verify token:** same value as `META_WEBHOOK_VERIFY_TOKEN`
3. Click **Verify and save**
4. Subscribe to the **messages** field

## Add test recipient

In Meta Dashboard → **WhatsApp** → **API Setup**:

- In the **To** field, add your personal phone number as a test recipient
- This lets you receive messages from the Meta test number (`+1 555 655 9820`)

## Connect in RelayInn

1. Open **Settings → Integrations → WhatsApp**
2. Enter your personal phone (test recipient) in E.164 format, e.g. `+34612345678`
3. Enter your **Meta Phone Number ID** from the Meta Dashboard
4. Click **Connect WhatsApp**
5. Use **Send test message** to verify outbound messaging

## How it works

1. Guest sends WhatsApp to the Meta test number
2. Meta POSTs to `meta-whatsapp-webhook`
3. Webhook finds the connected hotel, looks up or creates guest and conversation
4. Message is saved with `sender_type='guest'`
5. Inbox real-time subscription shows the message instantly
6. Staff replies → frontend calls `send-meta-whatsapp`
7. Edge function sends via Meta Graph API and saves the staff message

## Test the flow

1. Add your personal number as a test recipient in Meta Dashboard
2. From your personal WhatsApp, send a message to **+1 555 655 9820**
3. The message should appear in RelayInn inbox within seconds
4. Reply from the inbox — it should arrive on your WhatsApp
5. In **Settings → Integrations → WhatsApp**, use **Send test message** to verify outbound

## Meta sandbox limitations

- Only numbers added as test recipients can send/receive messages during development
- Test numbers are for development only
- For production: complete Meta Business verification and register a production phone number

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook verification fails | Check `META_WEBHOOK_VERIFY_TOKEN` matches Meta Dashboard |
| Webhook returns 403 on POST | Check `META_APP_SECRET` is set and matches your Meta app |
| Messages not appearing | Confirm webhook URL is correct, subscribed to `messages`, function deployed with `--no-verify-jwt` |
| Send fails "Guest has no phone" | Add a phone number to the guest record (E.164 format, e.g. `+34612345678`) |
| Send fails with Meta API error | Ensure recipient is added as test recipient in Meta Dashboard |
| Test message not received | Confirm hotel `whatsapp_phone` matches your registered test recipient |
