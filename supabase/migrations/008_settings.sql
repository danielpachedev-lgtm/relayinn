-- Hotel profile & integration fields
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Madrid',
  ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
  ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
  ADD COLUMN IF NOT EXISTS twilio_whatsapp_number TEXT;

-- Quick replies
CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage quick replies"
  ON quick_replies FOR ALL
  USING (hotel_id = get_my_hotel_id())
  WITH CHECK (hotel_id = get_my_hotel_id());

-- Team management policies
CREATE POLICY "Staff can update teammates"
  ON staff FOR UPDATE
  USING (hotel_id = get_my_hotel_id())
  WITH CHECK (hotel_id = get_my_hotel_id());

CREATE POLICY "Owners can remove teammates"
  ON staff FOR DELETE
  USING (
    hotel_id = get_my_hotel_id()
    AND role != 'owner'
    AND EXISTS (
      SELECT 1 FROM staff s
      WHERE s.user_id = auth.uid()
        AND s.hotel_id = staff.hotel_id
        AND s.role = 'owner'
    )
  );

-- Fetch team with auth emails (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_hotel_team()
RETURNS TABLE (
  id UUID,
  hotel_id UUID,
  user_id UUID,
  name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  email TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    s.id,
    s.hotel_id,
    s.user_id,
    s.name,
    s.role,
    s.avatar_url,
    s.created_at,
    u.email::TEXT
  FROM staff s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.hotel_id = get_my_hotel_id()
  ORDER BY
    CASE s.role WHEN 'owner' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END,
    s.name;
$$;

GRANT EXECUTE ON FUNCTION get_hotel_team() TO authenticated;
