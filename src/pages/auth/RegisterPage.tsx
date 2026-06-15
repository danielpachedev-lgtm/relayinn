import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { APP_NAME } from '../../lib/brand'
import { loadHotelData } from '../../hooks/useAuth'
import { useHotelStore } from '../../store/hotelStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function RegisterPage() {
  const navigate = useNavigate()
  const { setHotel, setStaff } = useHotelStore()
  const [hotelName, setHotelName] = useState('')
  const [staffName, setStaffName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Create auth user (Supabase opens a session immediately when email confirm is off)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user account')

      // 2. Call the DB function to create hotel + staff atomically (bypasses RLS)
      const { error: rpcError } = await supabase.rpc('register_hotel', {
        hotel_name: hotelName,
        staff_name: staffName,
        staff_email: email,
      })

      if (rpcError) throw rpcError

      // Hydrate the store immediately — don't wait for onAuthStateChange race
      const result = await loadHotelData(authData.user.id)
      if (result) {
        setStaff(result.staff)
        setHotel(result.hotel)
      }

      navigate('/inbox')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Create your hotel account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E3DF] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Hotel name"
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="The Grand Hotel"
              required
            />
            <Input
              label="Your name"
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              required
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@hotel.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
              required
              helpText="At least 6 characters"
            />

            {error && (
              <div className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loading}
              size="lg"
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-4">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#2563EB] font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
