import { Link } from 'react-router-dom'
import { InboxMockup } from './InboxMockup'
import { APP_NAME } from '../../lib/brand'

export function HeroSection() {
  function scrollToDemo() {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="bg-[#F8F7F4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-sm font-medium text-[#6B7280] mb-4">For independent hotels</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] lg:leading-[1.1] font-bold text-[#111827] tracking-tight">
              All your guest messages. One inbox.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-[#6B7280] leading-relaxed max-w-xl">
              {APP_NAME} brings WhatsApp, email, and Instagram into one shared inbox for your
              team — with automations that work while you sleep.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-[8px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
              >
                Start free trial
              </Link>
              <button
                type="button"
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-[8px] bg-white text-[#374151] border border-[#E5E3DF] hover:bg-[#F3F2EF] transition-colors"
              >
                See how it works
              </button>
            </div>
            <p className="mt-4 text-sm text-[#9CA3AF]">
              14-day free trial · No credit card required
            </p>
          </div>

          <div className="hidden lg:block">
            <InboxMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
