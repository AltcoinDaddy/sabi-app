import { createFileRoute, Outlet, Link, useNavigate, redirect } from '@tanstack/react-router'
import { Home, Trophy, Megaphone, User, Plus, Search } from 'lucide-react'
import { useEffect } from 'react'
import { getStoredPhone, maskPhone } from '@/lib/auth'
import { useSessionPoints, writeLocalPoints } from '@/lib/useSession'
import { getMyStateFn } from '@/lib/server'

export const Route = createFileRoute('/app')({
  // Authentication gate: unauthenticated visitors are sent to /auth.
  // beforeLoad runs on the client where document.cookie is available;
  // on the server we let it render and the component effect redirects.
  beforeLoad: () => {
    if (typeof document !== 'undefined') {
      const cookie = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('sabi_user_phone='))
      const phone = cookie?.split('=').slice(1).join('=')
      if (!phone || decodeURIComponent(phone).replace(/\D/g, '').length < 10) {
        throw redirect({ to: '/auth' })
      }
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const navigate = useNavigate()
  const phone = getStoredPhone()
  const { points } = useSessionPoints()

  useEffect(() => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      navigate({ to: '/auth' })
      return
    }
    // Sync header balance with server truth on entry
    let cancelled = false
    getMyStateFn({ data: { phone } })
      .then((s) => {
        if (!cancelled) writeLocalPoints(s.myPoints)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [phone, navigate])

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col font-sans">

      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#0d0d0f]/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/app" className="flex items-center">
          <span className="font-extrabold text-2xl tracking-tighter italic">
            SabiPredict
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Points Pill — live balance */}
          <div className="flex items-center bg-[#1c1c1f] rounded-full p-1 pl-4 border border-white/5" title="Your weekly points">
            <span className="text-sabi text-xs font-bold mr-1">PTS</span>
            <span className="font-bold text-sm mr-2 tracking-tight tabular-nums">{points}</span>
            <Link
              to="/app"
              className="bg-sabi text-black rounded-full w-7 h-7 flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Earn more points"
            >
              <Plus className="w-4 h-4 stroke-3" />
            </Link>
          </div>

          {/* Profile shortcut with masked phone */}
          <Link
            to="/app/profile"
            className="h-10 px-3 rounded-full bg-[#1c1c1f] flex items-center gap-2 border border-white/5 text-white/70 hover:text-white"
            title={phone ?? 'Profile'}
          >
            <User className="w-5 h-5" />
            {phone && (
              <span className="text-xs font-mono font-bold hidden sm:inline">{maskPhone(phone)}</span>
            )}
          </Link>

          {/* Search Icon */}
          <button className="w-10 h-10 rounded-full bg-[#1c1c1f] hidden items-center justify-center border border-white/5 text-white/70 hover:text-white">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0f] border-t border-white/5 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 px-2">
          <Link to="/app" activeProps={{ className: 'text-sabi' }} inactiveProps={{ className: 'text-white/40' }} className="flex flex-col items-center gap-1 transition-colors" activeOptions={{ exact: true }}>
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Picks</span>
          </Link>
          <Link to="/app/leaderboard" activeProps={{ className: 'text-sabi' }} inactiveProps={{ className: 'text-white/40' }} className="flex flex-col items-center gap-1 transition-colors">
            <Trophy className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Board</span>
          </Link>
          <Link to="/app/advertise" activeProps={{ className: 'text-sabi' }} inactiveProps={{ className: 'text-white/40' }} className="flex flex-col items-center gap-1 transition-colors">
            <Megaphone className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ads</span>
          </Link>
          <Link to="/app/profile" activeProps={{ className: 'text-sabi' }} inactiveProps={{ className: 'text-white/40' }} className="flex flex-col items-center gap-1 transition-colors">
            <User className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">You</span>
          </Link>
        </div>
      </nav>

    </div>
  )
}
