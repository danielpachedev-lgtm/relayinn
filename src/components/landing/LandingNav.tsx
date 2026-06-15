import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME } from '../../lib/brand'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E3DF]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-[#111827] tracking-tight">
          {APP_NAME}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-[8px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
          >
            Start free trial
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden p-2 rounded-[6px] text-[#6B7280] hover:bg-[#F3F4F6]"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#E5E3DF] bg-white px-4 py-4 space-y-3">
          <Link
            to="/login"
            className="block text-sm font-medium text-[#6B7280] py-2"
            onClick={() => setMenuOpen(false)}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="block text-center text-sm font-medium px-4 py-2.5 rounded-[8px] bg-[#2563EB] text-white"
            onClick={() => setMenuOpen(false)}
          >
            Start free trial
          </Link>
        </div>
      )}
    </header>
  )
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
