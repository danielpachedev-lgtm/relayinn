-- Meta WhatsApp Cloud API (replaces per-hotel Twilio fields)
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
