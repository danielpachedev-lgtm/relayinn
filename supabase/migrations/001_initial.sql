-- Hotels (one per account)
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  plan TEXT DEFAULT 'starter', -- starter, pro, agency
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff members
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'staff', -- owner, manager, staff
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  room_number TEXT,
  check_in DATE,
  check_out DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- whatsapp, email, instagram, web
  status TEXT DEFAULT 'open', -- open, in_progress, resolved
  assigned_to UUID REFERENCES staff(id),
  is_urgent BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- guest, staff, system
  sender_id UUID,
  content TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automations
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL, -- booking_confirmed, pre_checkin_24h, checkin_day, mid_stay, pre_checkout, post_stay
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: staff can only access their hotel's data
CREATE POLICY "Staff can view their hotel"
  ON hotels FOR SELECT
  USING (id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update their hotel"
  ON hotels FOR UPDATE
  USING (id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view team members"
  ON staff FOR SELECT
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view guests"
  ON guests FOR SELECT
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert guests"
  ON guests FOR INSERT
  WITH CHECK (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update guests"
  ON guests FOR UPDATE
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view conversations"
  ON conversations FOR SELECT
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update conversations"
  ON conversations FOR UPDATE
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can view messages"
  ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid())
  ));

CREATE POLICY "Staff can insert messages"
  ON messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM conversations
    WHERE hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid())
  ));

CREATE POLICY "Staff can view automations"
  ON automations FOR SELECT
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage automations"
  ON automations FOR ALL
  USING (hotel_id IN (SELECT hotel_id FROM staff WHERE user_id = auth.uid()));
