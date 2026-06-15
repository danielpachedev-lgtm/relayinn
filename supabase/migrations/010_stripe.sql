-- Stripe subscription fields
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Backfill existing hotels
UPDATE hotels
SET
  trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days'),
  subscription_status = COALESCE(subscription_status, 'trial')
WHERE trial_ends_at IS NULL OR subscription_status IS NULL;
