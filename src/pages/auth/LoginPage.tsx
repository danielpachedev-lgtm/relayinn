import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { APP_NAME } from '../../lib/brand'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from as { pathname?: string; search?: string } | undefined
  const redirectTo = from?.pathname
    ? `${from.pathname}${from.search ?? ''}`
    : '/inbox'
  const afterCheckout = redirectTo.includes('success=true')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate(redirectTo, { replace: true })
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
            {afterCheckout
              ? 'Sign in to finish activating your subscription'
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E3DF] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              autoComplete="current-password"
              required
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
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-4">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[#2563EB] font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
