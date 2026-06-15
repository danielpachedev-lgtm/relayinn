-- Atomic registration function that runs as the DB owner (bypasses RLS)
-- Called from the client via supabase.rpc('register_hotel', {...})
CREATE OR REPLACE FUNCTION register_hotel(
  hotel_name TEXT,
  staff_name TEXT,
  staff_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_hotel_id UUID;
  v_staff_id UUID;
BEGIN
  -- Get the calling user's ID from the JWT
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the hotel
  INSERT INTO hotels (name, email)
  VALUES (hotel_name, staff_email)
  RETURNING id INTO v_hotel_id;

  -- Create the owner staff record
  INSERT INTO staff (hotel_id, user_id, name, role)
  VALUES (v_hotel_id, v_user_id, staff_name, 'owner')
  RETURNING id INTO v_staff_id;

  RETURN json_build_object(
    'hotel_id', v_hotel_id,
    'staff_id', v_staff_id
  );
END;
$$;
