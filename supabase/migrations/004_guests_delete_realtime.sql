-- Allow staff to delete guests (cascades to conversations + messages)
CREATE POLICY "Staff can delete guests"
  ON guests FOR DELETE
  USING (hotel_id = get_my_hotel_id());

-- Enable real-time for guests table
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
