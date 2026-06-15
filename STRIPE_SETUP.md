# Stripe Setup

## 1. Create products in Stripe Dashboard

Go to **Stripe Dashboard → Products → Add product**

Create 2 products:

| Product | Price |
|---------|-------|
| RelayInn Starter | $39/month recurring |
| RelayInn Pro | $79/month recurring |

Copy each **Price ID** (starts with `price_`).

## 2. Environment variables

Add to your local `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
VITE_STRIPE_PRICE_STARTER=price_xxxx
VITE_STRIPE_PRICE_PRO=price_xxxx
```

## 3. Set Stripe secrets in Supabase

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxx
supabase secrets set STRIPE_PRICE_STARTER=price_xxxx
supabase secrets set STRIPE_PRICE_PRO=price_xxxx
supabase secrets set APP_URL=https://relayinn.vercel.app
```

For local development, set `APP_URL=http://localhost:5173`.

The frontend sends `appUrl` from `VITE_APP_URL` on checkout/portal requests; keep `APP_URL` in sync as a fallback.

## 4. Deploy edge functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 5. Configure webhook in Stripe Dashboard

**Stripe Dashboard → Developers → Webhooks → Add endpoint**

| Setting | Value |
|---------|-------|
| URL | `https://vpeagsczoyizqevozrlb.supabase.co/functions/v1/stripe-webhook` |
| Events | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` |

Copy the **Signing secret** (`whsec_...`) to `STRIPE_WEBHOOK_SECRET`.

## 6. Test the flow

Use Stripe test card: **4242 4242 4242 4242** — any future expiry, any CVC.

1. Log in to RelayInn — trial banner shows days remaining
2. Go to **Settings → Billing** → click **Upgrade to Pro**
3. Complete Stripe Checkout
4. Redirected back with `?success=true` — status becomes **active**, banner disappears
5. **Manage subscription** opens Stripe Customer Portal

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Checkout fails immediately | Verify `STRIPE_SECRET_KEY` and price IDs in Supabase secrets |
| Webhook not updating DB | Confirm webhook URL, `--no-verify-jwt`, and `STRIPE_WEBHOOK_SECRET` |
| Wrong redirect URL | Set `APP_URL` secret to your frontend URL |
| Price not found | Price IDs in `.env` must match Stripe Dashboard exactly |
