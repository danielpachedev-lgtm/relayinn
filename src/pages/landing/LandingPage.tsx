import { lazy, Suspense } from 'react'
import { LandingNav } from '../../components/landing/LandingNav'
import { HeroSection } from '../../components/landing/HeroSection'

const LandingContent = lazy(() => import('../../components/landing/LandingContent'))

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <LandingNav />
      <main>
        <HeroSection />
        <Suspense fallback={<div className="min-h-[50vh]" aria-hidden />}>
          <LandingContent />
        </Suspense>
      </main>
    </div>
  )
}
