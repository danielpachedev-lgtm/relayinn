-- Track when each automation last sent a message
ALTER TABLE automations
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- Log every automated message sent
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  trigger TEXT NOT NULL,
  message_sent TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view automation logs"
  ON automation_logs FOR SELECT
  USING (hotel_id = get_my_hotel_id());

CREATE POLICY "Staff can insert automation logs"
  ON automation_logs FOR INSERT
  WITH CHECK (hotel_id = get_my_hotel_id());

-- Enable real-time on automations for multi-staff sync
ALTER PUBLICATION supabase_realtime ADD TABLE automations;
