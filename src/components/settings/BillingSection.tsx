import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../ui/Button'
import { useHotelStore } from '../../store/hotelStore'
import { fetchUsageStats, refreshHotel } from '../../lib/settingsService'
import { redirectToCheckout, redirectToPortal } from '../../lib/stripeService'
import {
  getTrialDaysRemaining,
  STRIPE_PRICE_IDS,
  PLAN_ENFORCEMENT_LIMITS,
  getEffectivePlanKey,
} from '../../lib/planLimits'
import { PLANS, PLAN_LIMITS } from '../../lib/settingsConstants'
import type { PlanId } from '../../types'

export function BillingSection() {
  const { currentHotel, setHotel, setUsageStats } = useHotelStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [usage, setUsage] = useState({ conversations: 0, teamMembers: 0 })
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const status = currentHotel?.subscription_status ?? 'trial'
  const plan = currentHotel?.plan ?? 'starter'
  const planInfo = PLANS.find((p) => p.id === plan) ?? PLANS[0]
  const limits = PLAN_LIMITS[plan]
  const effectiveKey = getEffectivePlanKey(currentHotel)
  const enforcementLimits = PLAN_ENFORCEMENT_LIMITS[effectiveKey]

  useEffect(() => {
    if (!currentHotel) return
    fetchUsageStats(currentHotel.id)
      .then((stats) => {
        setUsage(stats)
        setUsageStats(stats.teamMembers, stats.conversations)
      })
      .finally(() => setLoading(false))
  }, [currentHotel, setUsageStats])

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    if (!success && !canceled) return

    if (success === 'true' && currentHotel) {
      refreshHotel(currentHotel.id).then((hotel) => {
        if (hotel) {
          setHotel(hotel)
          toast.success('Subscription activated!')
        }
      })
    }
    if (canceled === 'true') {
      toast.error('Checkout canceled')
    }

    const next = new URLSearchParams(searchParams)
    next.delete('success')
    next.delete('canceled')
    setSearchParams(next, { replace: true })
  }, [searchParams, currentHotel, setHotel, setSearchParams])

  async function handleCheckout(planId: PlanId) {
    const priceId = STRIPE_PRICE_IDS[planId]
    if (!priceId) {
      toast.error('Stripe price not configured. Add VITE_STRIPE_PRICE_* to .env')
      return
    }
    setCheckoutLoading(planId)
    try {
      await redirectToCheckout(priceId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      await redirectToPortal()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open portal')
      setPortalLoading(false)
    }
  }

  function formatDate(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-[#111827] mb-1">Billing</h2>
      <p className="text-sm text-[#6B7280] mb-6">Your current plan and usage.</p>

      {status === 'past_due' && (
        <div className="mb-6 p-4 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA]">
          <p className="text-sm font-medium text-[#DC2626]">
            Payment failed. Please update your payment method.
          </p>
          <Button variant="danger" className="mt-3" onClick={handlePortal} loading={portalLoading}>
            Update payment method
          </Button>
        </div>
      )}

      {status === 'canceled' && (
        <div className="mb-6 p-4 rounded-[10px] bg-[#F3F4F6] border border-[#E5E3DF]">
          <p className="text-sm font-medium text-[#374151]">Your subscription has ended.</p>
          <p className="text-xs text-[#6B7280] mt-1">Choose a plan below to resubscribe.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-[10px] border border-[#E5E3DF] p-6">
          {status === 'trial' ? (
            <TrialCard
              trialEndsAt={currentHotel?.trial_ends_at}
              onUpgrade={handleCheckout}
              checkoutLoading={checkoutLoading}
            />
          ) : status === 'active' ? (
            <ActiveCard
              planInfo={planInfo}
              periodEnd={currentHotel?.current_period_end}
              onManage={handlePortal}
              portalLoading={portalLoading}
              formatDate={formatDate}
            />
          ) : (
            <div>
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Current plan
              </p>
              <h3 className="text-xl font-semibold text-[#111827] mt-1">{planInfo.name}</h3>
              <p className="text-2xl font-bold text-[#2563EB] mt-0.5">{planInfo.price}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[10px] border border-[#E5E3DF] p-6">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-4">
            Usage this month
          </p>
          {loading ? (
            <p className="text-sm text-[#6B7280]">Loading…</p>
          ) : (
            <div className="space-y-5">
              <UsageBar
                label="Conversations"
                current={usage.conversations}
                limit={enforcementLimits.maxConversations === Infinity ? null : enforcementLimits.maxConversations}
              />
              <UsageBar
                label="Team members"
                current={usage.teamMembers}
                limit={limits.team}
              />
            </div>
          )}
        </div>
      </div>

      {(status === 'trial' || status === 'canceled') && (
        <PlanPicker
          currentPlan={plan}
          onSelect={handleCheckout}
          loading={checkoutLoading}
        />
      )}

      {status === 'active' && (
        <>
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Your plan includes</h3>
          <ul className="bg-white rounded-[10px] border border-[#E5E3DF] p-6 space-y-2 mb-8">
            {planInfo.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-[#374151]">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="text-sm font-semibold text-[#111827] mb-3">Compare plans</h3>
      <div className="bg-white rounded-[10px] border border-[#E5E3DF] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E3DF] max-w-2xl">
          {PLANS.map((p) => (
            <div key={p.id} className={`p-5 ${p.id === plan && status === 'active' ? 'bg-[#EFF6FF]/50' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#111827]">{p.name}</h4>
                {p.id === plan && status === 'active' && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#2563EB] text-white">
                    Current
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-[#2563EB] mb-4">{p.price}</p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="text-xs text-[#6B7280] flex items-start gap-1.5">
                    <span className="text-[#16A34A] mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrialCard({
  trialEndsAt,
  onUpgrade,
  checkoutLoading,
}: {
  trialEndsAt: string | null | undefined
  onUpgrade: (plan: PlanId) => void
  checkoutLoading: PlanId | null
}) {
  const days = getTrialDaysRemaining(trialEndsAt ?? null)

  return (
    <div>
      <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FEF9C3] text-[#713F12]">
        Free Trial
      </span>
      <h3 className="text-xl font-semibold text-[#111827] mt-3">
        {days} {days === 1 ? 'day' : 'days'} remaining
      </h3>
      <p className="text-sm text-[#6B7280] mt-1">
        Trial ends {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : 'soon'}
      </p>
      <p className="text-sm text-[#6B7280] mt-4">
        Upgrade before your trial ends to keep your inbox, guests, and automations.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['starter', 'pro'] as PlanId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            onClick={() => onUpgrade(id)}
            loading={checkoutLoading === id}
          >
            Upgrade to {id.charAt(0).toUpperCase() + id.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  )
}

function ActiveCard({
  planInfo,
  periodEnd,
  onManage,
  portalLoading,
  formatDate,
}: {
  planInfo: (typeof PLANS)[number]
  periodEnd: string | null | undefined
  onManage: () => void
  portalLoading: boolean
  formatDate: (iso: string | null | undefined) => string
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
            Current plan
          </p>
          <h3 className="text-xl font-semibold text-[#111827] mt-1">{planInfo.name}</h3>
          <p className="text-2xl font-bold text-[#2563EB] mt-0.5">{planInfo.price}</p>
        </div>
        <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#F0FDF4] text-[#16A34A]">
          Active
        </span>
      </div>
      <p className="text-sm text-[#6B7280]">
        Next billing date: {formatDate(periodEnd)}
      </p>
      <Button className="mt-4" variant="secondary" onClick={onManage} loading={portalLoading}>
        Manage subscription
      </Button>
    </div>
  )
}

function PlanPicker({
  currentPlan,
  onSelect,
  loading,
}: {
  currentPlan: PlanId
  onSelect: (plan: PlanId) => void
  loading: PlanId | null
}) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-[#111827] mb-3">Choose a plan</h3>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-[10px] border p-5 ${
              p.id === 'pro' ? 'border-2 border-[#2563EB]' : 'border-[#E5E3DF]'
            }`}
          >
            {p.id === 'pro' && (
              <span className="text-[10px] font-semibold uppercase text-[#2563EB]">Most popular</span>
            )}
            <h4 className="text-lg font-semibold text-[#111827] mt-1">{p.name}</h4>
            <p className="text-xl font-bold text-[#2563EB]">{p.price}</p>
            <Button
              className="w-full mt-4"
              variant={p.id === currentPlan ? 'secondary' : 'primary'}
              onClick={() => onSelect(p.id)}
              loading={loading === p.id}
            >
              Subscribe
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string
  current: number
  limit: number | null
}) {
  const pct = limit ? Math.min(100, (current / limit) * 100) : 0
  const display = limit ? `${current} / ${limit}` : `${current} (unlimited)`

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#374151]">{label}</span>
        <span className="text-[#6B7280]">{display}</span>
      </div>
      {limit && (
        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-[#DC2626]' : 'bg-[#2563EB]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
