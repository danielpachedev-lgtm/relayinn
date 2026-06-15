-- Allow staff to mark messages as read (update read_at)
CREATE POLICY "Staff can update messages"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE hotel_id = get_my_hotel_id()
    )
  );

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
