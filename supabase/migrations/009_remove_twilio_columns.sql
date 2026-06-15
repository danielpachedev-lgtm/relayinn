-- Remove Twilio credential columns (WhatsApp uses whatsapp_phone + whatsapp_connected only)
ALTER TABLE hotels
  DROP COLUMN IF EXISTS twilio_account_sid,
  DROP COLUMN IF EXISTS twilio_auth_token,
  DROP COLUMN IF EXISTS twilio_whatsapp_number;
