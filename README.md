# RelayInn

Shared inbox for independent hotels — WhatsApp, email, and Instagram in one place, with automations and guest profiles.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase (auth, database, edge functions, realtime)
- Stripe (subscriptions)
- Twilio (WhatsApp, being replaced by Meta Cloud API)
- Vercel (frontend hosting)

## Local development

```bash
npm install
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, Stripe keys
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deployment (Vercel)

Production URL: **https://relayinn.vercel.app** (free Vercel subdomain).

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial RelayInn deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USER/relayinn.git
git push -u origin main
```

### 2. Connect GitHub to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `relayinn` repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

Vercel auto-deploys on every push to `main`.

### 3. Environment variables (Vercel Dashboard)

**Project → Settings → Environment Variables** — add for **Production**, **Preview**, and **Development**:

| Variable | Example |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |
| `VITE_STRIPE_PRICE_STARTER` | `price_...` |
| `VITE_STRIPE_PRICE_PRO` | `price_...` |
| `VITE_APP_URL` | `https://relayinn.vercel.app` |

> `VITE_*` vars are embedded at **build time**. Redeploy after changing them.

### 4. Supabase production URL

Update edge function secrets so Stripe redirects work when the client does not send `appUrl`:

```bash
npx supabase secrets set APP_URL=https://relayinn.vercel.app --project-ref YOUR_PROJECT_REF
```

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** `https://relayinn.vercel.app`
- **Redirect URLs:** add `https://relayinn.vercel.app/**` and `http://localhost:5173/**`

Redeploy Stripe edge functions after secret changes:

```bash
npx supabase functions deploy create-checkout-session --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-portal-session --project-ref YOUR_PROJECT_REF
npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref YOUR_PROJECT_REF
```

### 5. Verify

1. Open https://relayinn.vercel.app
2. Register / log in
3. Settings → Billing → upgrade flow (test card `4242 4242 4242 4242`)
4. Confirm redirect back to `/settings?section=billing&success=true`

## Documentation

- [STRIPE_SETUP.md](./STRIPE_SETUP.md) — subscriptions and billing
- [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md) — WhatsApp via Twilio (legacy)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
