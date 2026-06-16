-- Per-hotel Meta WhatsApp credentials (Embedded Signup)
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
  ADD COLUMN IF NOT EXISTS meta_waba_id TEXT;
