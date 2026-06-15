import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { LandingPage } from './pages/landing/LandingPage'
import { InboxPage } from './pages/inbox/InboxPage'
import { GuestsPage } from './pages/guests/GuestsPage'
import { AutomationsPage } from './pages/automations/AutomationsPage'
import { StatsPage } from './pages/stats/StatsPage'
import { SettingsPage } from './pages/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: '8px',
            fontSize: '13px',
            background: '#1C1917',
            color: '#fff',
          },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/guests" element={<GuestsPage />} />
            <Route path="/automations" element={<AutomationsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
