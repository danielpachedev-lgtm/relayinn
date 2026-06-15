-- conversations.guest_id was missing ON DELETE CASCADE, so deleting a guest
-- failed while conversations still referenced it.

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_guest_id_fkey;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_guest_id_fkey
  FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;

-- RLS: cascaded deletes on conversations/messages need DELETE policies
CREATE POLICY "Staff can delete conversations"
  ON conversations FOR DELETE
  USING (hotel_id = get_my_hotel_id());

CREATE POLICY "Staff can delete messages"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE hotel_id = get_my_hotel_id()
    )
  );
