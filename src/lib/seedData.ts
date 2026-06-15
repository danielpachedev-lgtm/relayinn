import { supabase } from './supabase'

export async function seedTestData(hotelId: string): Promise<void> {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const daysFromNow = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return fmt(d)
  }
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

  // 1. Insert guests
  const { data: guests, error: guestErr } = await supabase
    .from('guests')
    .insert([
      {
        hotel_id: hotelId,
        name: 'Juan García',
        phone: '+34612345678',
        room_number: '204',
        check_in: daysFromNow(0),
        check_out: daysFromNow(3),
      },
      {
        hotel_id: hotelId,
        name: 'Sarah Smith',
        room_number: '101',
        check_in: daysFromNow(-1),
        check_out: daysFromNow(1),
      },
      {
        hotel_id: hotelId,
        name: 'Carlos López',
        room_number: '308',
        check_in: daysFromNow(-2),
        check_out: daysFromNow(1),
        notes: 'VIP guest, repeat visitor',
      },
    ])
    .select()

  if (guestErr || !guests) throw new Error('Failed to insert guests: ' + guestErr?.message)

  const [juan, sarah, carlos] = guests

  // 2. Insert conversations
  const { data: convos, error: convoErr } = await supabase
    .from('conversations')
    .insert([
      {
        hotel_id: hotelId,
        guest_id: juan.id,
        channel: 'whatsapp',
        status: 'open',
        last_message_at: ago(2 * 60 * 1000),
      },
      {
        hotel_id: hotelId,
        guest_id: sarah.id,
        channel: 'email',
        status: 'in_progress',
        last_message_at: ago(60 * 60 * 1000),
      },
      {
        hotel_id: hotelId,
        guest_id: carlos.id,
        channel: 'whatsapp',
        status: 'open',
        is_urgent: true,
        last_message_at: ago(3 * 60 * 60 * 1000),
      },
    ])
    .select()

  if (convoErr || !convos) throw new Error('Failed to insert conversations: ' + convoErr?.message)

  const [juanConvo, sarahConvo, carlosConvo] = convos

  // 3. Insert messages
  const { error: msgErr } = await supabase.from('messages').insert([
    // Juan García — parking inquiry
    { conversation_id: juanConvo.id, sender_type: 'guest', content: 'Hi, do you have parking available?', created_at: ago(35 * 60 * 1000) },
    { conversation_id: juanConvo.id, sender_type: 'staff', content: 'Hello Juan! Yes, we have free parking for guests. Do you need a spot?', created_at: ago(30 * 60 * 1000) },
    { conversation_id: juanConvo.id, sender_type: 'guest', content: "Yes please, I'll arrive around 4pm", created_at: ago(20 * 60 * 1000) },
    { conversation_id: juanConvo.id, sender_type: 'staff', content: "Perfect, we'll reserve a spot for you. See you at 4!", created_at: ago(15 * 60 * 1000) },
    { conversation_id: juanConvo.id, sender_type: 'guest', content: 'Thank you!', created_at: ago(2 * 60 * 1000) },

    // Sarah Smith — late checkout
    { conversation_id: sarahConvo.id, sender_type: 'guest', content: 'Hello, can I get a late checkout tomorrow?', created_at: ago(5 * 60 * 60 * 1000) },
    { conversation_id: sarahConvo.id, sender_type: 'staff', content: 'Hi Sarah! Late checkout until 2pm is available for €20. Shall I arrange it?', created_at: ago(4 * 60 * 60 * 1000) },
    { conversation_id: sarahConvo.id, sender_type: 'guest', content: 'Yes please, that would be great', created_at: ago(3 * 60 * 60 * 1000) },
    { conversation_id: sarahConvo.id, sender_type: 'staff', content: 'Done! Late checkout confirmed until 2pm. Enjoy your evening!', created_at: ago(2 * 60 * 60 * 1000) },
    { conversation_id: sarahConvo.id, sender_type: 'guest', content: 'Perfect, thank you so much', created_at: ago(1 * 60 * 60 * 1000) },

    // Carlos López — maintenance
    { conversation_id: carlosConvo.id, sender_type: 'guest', content: 'The shower in room 308 is not working properly', created_at: ago(6 * 60 * 60 * 1000) },
    { conversation_id: carlosConvo.id, sender_type: 'staff', content: "Hi Carlos, so sorry about that! I'm sending maintenance right away.", created_at: ago(5 * 60 * 60 * 1000) },
    { conversation_id: carlosConvo.id, sender_type: 'system', content: 'Maintenance team notified', created_at: ago(5 * 60 * 60 * 1000) },
    { conversation_id: carlosConvo.id, sender_type: 'staff', content: 'Maintenance is on their way, should be there in 10 minutes.', created_at: ago(4 * 60 * 60 * 1000) },
    { conversation_id: carlosConvo.id, sender_type: 'guest', content: 'Still not fixed, been waiting 2 hours', created_at: ago(3 * 60 * 60 * 1000) },
  ])

  if (msgErr) throw new Error('Failed to insert messages: ' + msgErr.message)
}
