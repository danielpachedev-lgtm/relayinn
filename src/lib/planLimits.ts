import type { Hotel, PlanId } from '../types'

export type PlanLimitKey = 'trial' | PlanId

export const PLAN_ENFORCEMENT_LIMITS = {
  trial: { maxStaff: 3, maxConversations: 50 },
  starter: { maxStaff: 3, maxConversations: 500 },
  pro: { maxStaff: 10, maxConversations: Infinity },
} as const

export function getEffectivePlanKey(hotel: Hotel | null): PlanLimitKey {
  if (!hotel) return 'trial'
  if (hotel.subscription_status === 'trial') return 'trial'
  if ((hotel.plan as string) === 'agency') return 'pro'
  return hotel.plan
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const ms = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86400000))
}

export function canAddStaff(hotel: Hotel | null, staffCount: number): boolean {
  const limits = PLAN_ENFORCEMENT_LIMITS[getEffectivePlanKey(hotel)]
  return staffCount < limits.maxStaff
}

export function canStartConversation(hotel: Hotel | null, monthlyConversations: number): boolean {
  const limits = PLAN_ENFORCEMENT_LIMITS[getEffectivePlanKey(hotel)]
  return monthlyConversations < limits.maxConversations
}

export const STRIPE_PRICE_IDS = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER as string,
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO as string,
} as const
