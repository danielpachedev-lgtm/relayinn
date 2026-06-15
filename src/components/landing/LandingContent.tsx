import { Link } from 'react-router-dom'
import { APP_NAME, SUPPORT_EMAIL } from '../../lib/brand'

export default function LandingContent() {
  return (
    <>
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
      <LandingFooter />
    </>
  )
}

function SectionHeading({
  title,
  subtitle,
  className = '',
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={`text-center max-w-2xl mx-auto mb-12 lg:mb-16 ${className}`}>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-[#6B7280] leading-relaxed">{subtitle}</p>
      )}
    </div>
  )
}

function ProblemSection() {
  const items = [
    {
      icon: '📱',
      title: 'WhatsApp on personal phones',
      desc: 'Messages get lost when staff changes shift or goes on holiday.',
    },
    {
      icon: '📧',
      title: 'Emails nobody reads in time',
      desc: 'Guest requests buried in a shared inbox with no ownership or follow-up.',
    },
    {
      icon: '📸',
      title: 'Instagram DMs go unanswered',
      desc: 'Potential guests ask questions and never hear back.',
    },
  ]

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading title="Your guests are messaging you everywhere." />
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {items.map((item) => (
            <div key={item.title} className="text-center md:text-left">
              <span className="text-3xl" role="img" aria-hidden>
                {item.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[#111827]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SolutionSection() {
  const features = [
    {
      icon: '🗂',
      title: 'Shared inbox',
      desc: 'WhatsApp, email, and Instagram in one place. Assign conversations, add internal notes, and resolve requests as a team.',
    },
    {
      icon: '⚡',
      title: 'Automations',
      desc: 'Set up automatic messages for check-in, mid-stay, and post-stay — and never chase a review request again.',
    },
    {
      icon: '👤',
      title: 'Guest profiles',
      desc: 'Every guest has a profile with their stay details, preferences, and full conversation history.',
    },
  ]

  return (
    <section id="demo" className="bg-[#F8F7F4] py-16 lg:py-24 scroll-mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          title="One place for everything."
          subtitle="Your whole team sees every message, from every channel, in real time."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-[12px] border border-[#E5E3DF] p-6 lg:p-8"
            >
              <span className="text-2xl" role="img" aria-hidden>
                {f.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[#111827]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      num: '1',
      title: 'Create your account',
      desc: 'Register your hotel in under 2 minutes.',
    },
    {
      num: '2',
      title: 'Connect your channels',
      desc: 'Link your WhatsApp Business number, email, and Instagram.',
    },
    {
      num: '3',
      title: 'Start responding',
      desc: 'Your whole team can see and reply to every guest message from one screen.',
    },
  ]

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading title="Up and running in 15 minutes." />
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#EFF6FF] text-[#2563EB] text-lg font-bold">
                {step.num}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#111827]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$39',
      highlight: false,
      features: [
        'Up to 3 team members',
        '500 conversations/month',
        'WhatsApp + Email',
        '6 automations',
        'Email support',
      ],
      cta: 'Start free trial',
      href: '/register',
      contact: false,
    },
    {
      name: 'Pro',
      price: '$79',
      highlight: true,
      features: [
        'Up to 10 team members',
        'Unlimited conversations',
        'WhatsApp + Email + Instagram',
        'All automations',
        'Priority support',
        'PMS integrations',
      ],
      cta: 'Start free trial',
      href: '/register',
      contact: false,
    },
  ]

  return (
    <section className="bg-[#F8F7F4] py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading title="Simple pricing. No surprises." />
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-[12px] p-6 lg:p-8 flex flex-col ${
                plan.highlight
                  ? 'border-2 border-[#2563EB] shadow-lg'
                  : 'border border-[#E5E3DF]'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold rounded-full bg-[#2563EB] text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-[#111827]">{plan.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-[#111827]">{plan.price}</span>
                <span className="text-sm text-[#6B7280]">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#374151]">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.contact ? (
                <a
                  href={plan.href}
                  className="mt-8 block text-center px-4 py-2.5 text-sm font-semibold rounded-[8px] border border-[#E5E3DF] text-[#374151] hover:bg-[#F3F2EF] transition-colors"
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  to={plan.href}
                  className={`mt-8 block text-center px-4 py-2.5 text-sm font-semibold rounded-[8px] transition-colors ${
                    plan.highlight
                      ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                      : 'border border-[#E5E3DF] text-[#374151] hover:bg-[#F3F2EF]'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[#6B7280]">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const quotes = [
    {
      text: 'We used to manage WhatsApp from the owner\'s personal phone. Now the whole team sees every message and response times are much faster.',
      author: 'Maria S.',
      role: 'Boutique Hotel, Barcelona',
    },
    {
      text: 'The automatic check-in message alone saves us 30 minutes every day. Guests arrive knowing everything they need.',
      author: 'James T.',
      role: 'B&B Owner, London',
    },
    {
      text: 'Finally a tool that doesn\'t cost €200/month and doesn\'t need an IT person to set up.',
      author: 'Luca R.',
      role: 'Hotel Manager, Milan',
    },
  ]

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading title="Built for hotels like yours" />
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {quotes.map((q) => (
            <blockquote
              key={q.author}
              className="bg-[#F8F7F4] rounded-[12px] border border-[#E5E3DF] p-6 lg:p-8"
            >
              <p className="text-sm text-[#374151] leading-relaxed">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-4">
                <p className="text-sm font-semibold text-[#111827]">— {q.author}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{q.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaSection() {
  return (
    <section className="bg-[#1C1917] py-16 lg:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ready to simplify guest communication?
        </h2>
        <p className="mt-4 text-base sm:text-lg text-white/60">
          Join hotels across Europe already using {APP_NAME}.
        </p>
        <Link
          to="/register"
          className="inline-flex mt-8 px-8 py-3 text-sm font-semibold rounded-[8px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
        >
          Start your free trial
        </Link>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="bg-white border-t border-[#E5E3DF] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-[#111827]">{APP_NAME}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">© 2026 {APP_NAME}. All rights reserved.</p>
        </div>
        <nav className="flex items-center gap-6">
          <a href="#" className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors">
            Terms of Service
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  )
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-[#16A34A] flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
