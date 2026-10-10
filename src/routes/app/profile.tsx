import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { User, Trophy, Calendar, LogOut, BadgeCheck, Landmark, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearStoredPhone, maskPhone, getStoredPhone } from '@/lib/auth'
import { pointsForPrediction, type Prediction } from '@/lib/scoring'
import { getMyProfileFn } from '@/lib/server'

export const Route = createFileRoute('/app/profile')({
  component: ProfileScreen,
})

type ProfileData = Awaited<ReturnType<typeof getMyProfileFn>>

function ProfileScreen() {
  const navigate = useNavigate()
  const [data, setData] = useState<ProfileData | null>(null)
  const [failed, setFailed] = useState(false)
  const phone = getStoredPhone() ?? ''

  useEffect(() => {
    if (!phone) {
      navigate({ to: '/auth' })
      return
    }
    let cancelled = false
    getMyProfileFn({ data: { phone } })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [phone, navigate])

  const handleLogout = () => {
    clearStoredPhone()
    navigate({ to: '/auth' })
  }

  if (failed) {
    return (
      <div className="p-4 flex flex-col gap-4 items-center py-16 text-center">
        <p className="font-bold">Couldn&apos;t load your profile</p>
        <p className="text-sm text-white/50">Check your connection and try again.</p>
        <Button onClick={() => window.location.reload()} className="bg-sabi text-black font-bold">Retry</Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 flex flex-col items-center py-16 gap-3">
        <Loader2 className="w-8 h-8 text-sabi animate-spin" />
        <p className="text-sm font-semibold text-white/50">Loading your profile…</p>
      </div>
    )
  }

  const { myPoints, myRank, seasonRank, history } = data

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-20 h-20 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-white/50" />
        </div>
        <h2 className="text-xl font-mono font-bold">{phone ? maskPhone(phone) : '—'}</h2>
        <p className="text-sm text-sabi mt-1 font-bold">Sabi Player · Rank #{myRank || '—'}</p>
        {myRank === 1 && (
          <div className="mt-4 w-full bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex gap-3">
            <Landmark className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-yellow-100/90">
              <p className="font-bold text-yellow-200 mb-1">You&apos;re 1st — claim your cash</p>
              <p>Add bank / wallet details so we can pay your Naira share. Airtime winners are paid automatically to this number.</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5">
          <Trophy className="h-5 w-5 text-sabi" />
          <span className="text-2xl font-black tabular-nums">{myPoints}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Weekly Pts</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5">
          <Calendar className="h-5 w-5 text-blue-400" />
          <span className="text-2xl font-black">#{myRank || '—'}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Weekly Rank</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5">
          <BadgeCheck className="h-5 w-5 text-purple-400" />
          <span className="text-2xl font-black">#{seasonRank || '—'}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold">Season Rank</span>
        </div>
      </div>

      {/* History */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Pick history</h3>
          <span className="text-xs text-white/50 font-semibold">{history.length} pick{history.length === 1 ? '' : 's'}</span>
        </div>
        {history.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-6 text-center">
            <p className="font-bold mb-1">No picks yet</p>
            <p className="text-sm text-white/50">Make your first pick to start earning points.</p>
            <Button onClick={() => navigate({ to: '/app' })} className="mt-4 bg-sabi text-black hover:bg-white font-bold">
              Pick winners
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((h) => {
              const earned = pointsForPrediction((h.predictedResult as Prediction) ?? 'home')
              return (
                <div key={h.id} className="bg-white/5 rounded-xl p-4 flex justify-between items-center border border-white/5">
                  <div>
                    <p className="font-medium text-sm">{h.match!.homeTeam} vs {h.match!.awayTeam}</p>
                    <p className="text-xs text-white/50 capitalize">Picked: {h.predictedResult} · {h.status}</p>
                  </div>
                  <span className="text-sabi font-bold text-sm tabular-nums">+{earned} pts</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Button onClick={handleLogout} variant="outline" className="w-full mt-2 border-white/10 text-white hover:bg-white/10 h-12 font-bold">
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>
    </div>
  )
}
