import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { matches, ads } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { SabiLoader } from '@/components/SabiLoader'
import { Tag, Clock, Flame, Target, Swords, Activity, Loader2, Lock, BadgeCheck, Info } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { pointsForPrediction, SCORING_LEGEND, type Prediction } from '@/lib/scoring'
import { getStoredPhone } from '@/lib/auth'
import { readLocalPoints, writeLocalPoints } from '@/lib/useSession'
import { getMyStateFn, submitPickFn } from '@/lib/server'

// Public data only — personal picks/points load client-side with the
// signed-in phone so every number gets its own picks and points.
const getFixturesData = createServerFn({ method: 'GET' }).handler(async () => {
  const allMatches = await db.select().from(matches)
  const allAds = await db.select().from(ads).where(eq(ads.active, true)).orderBy(desc(ads.id))
  return {
    matches: allMatches.sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()),
    ads: allAds,
  }
})

export const Route = createFileRoute('/app/')({
  component: FixturesScreen,
  loader: () => getFixturesData(),
  pendingComponent: SabiLoader,
})

function timeUntil(kickoff: string | Date): string {
  const ms = new Date(kickoff).getTime() - Date.now()
  if (ms <= 0) return 'Locked'
  const h = Math.floor(ms / 36e5)
  const m = Math.floor((ms % 36e5) / 6e4)
  if (h >= 24) return `in ${Math.floor(h / 24)}d ${h % 24}h`
  if (h >= 1) return `in ${h}h ${m}m`
  return `in ${m}m`
}

type MyPick = { matchId: number; predictedResult: string }

function FixturesScreen() {
  const { matches, ads } = Route.useLoaderData()
  const router = useRouter()
  const [loadingPick, setLoadingPick] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [earnedFlash, setEarnedFlash] = useState<string | null>(null)
  const [userPicks, setUserPicks] = useState<MyPick[]>([])
  const [myPoints, setMyPoints] = useState(0)
  const [myRank, setMyRank] = useState(0)

  // Load personal state for the signed-in phone
  useEffect(() => {
    const phone = getStoredPhone()
    if (!phone) {
      setLoadingState(false)
      return
    }
    let cancelled = false
    getMyStateFn({ data: { phone } })
      .then((s) => {
        if (cancelled) return
        setUserPicks(s.userPicks.map((p) => ({ matchId: p.matchId, predictedResult: p.predictedResult })))
        setMyPoints(s.myPoints)
        setMyRank(s.myRank)
        if (s.myPoints > readLocalPoints()) writeLocalPoints(s.myPoints)
      })
      .catch(() => setNotice('Could not load your picks — check your connection and retry.'))
      .finally(() => {
        if (!cancelled) setLoadingState(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const featuredAd = ads.find((a) => a.slotName === 'fixture_banner')
  const picksByMatch = useMemo(() => new Map(userPicks.map((p) => [p.matchId, p])), [userPicks])
  const pickedCount = picksByMatch.size
  const lockedInPoints = useMemo(
    () =>
      [...picksByMatch.values()].reduce(
        (sum, p) => sum + pointsForPrediction((p.predictedResult as Prediction) ?? 'home'),
        0,
      ),
    [picksByMatch],
  )

  const handlePick = async (matchId: number, prediction: Prediction) => {
    const phone = getStoredPhone()
    if (!phone) {
      setNotice('Sign in again to make picks.')
      return
    }
    setLoadingPick(`${matchId}-${prediction}`)
    setNotice(null)
    try {
      const res = await submitPickFn({ data: { phone, matchId, prediction } })
      if (!res.success) {
        setNotice('That match is locked — picks close at kickoff.')
        return
      }
      writeLocalPoints(res.totalPoints)
      setMyPoints(res.totalPoints)
      setUserPicks((prev) => {
        const next = prev.filter((p) => p.matchId !== matchId)
        next.push({ matchId, predictedResult: prediction })
        return next
      })
      if (res.delta !== 0) {
        setEarnedFlash(`${res.delta > 0 ? '+' : ''}${res.delta} PTS`)
        setTimeout(() => setEarnedFlash(null), 2200)
      }
      await router.invalidate()
    } catch {
      setNotice('Pick failed — check your connection and try again.')
    } finally {
      setLoadingPick(null)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-6 pb-10">
      {/* Week status — standard prediction header */}
      <section className="bg-[#1c1c1f] border border-white/5 rounded-[24px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-sabi">Week 12 · Free to Play</p>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Make your picks</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-sabi tabular-nums leading-none">
              {loadingState ? '…' : myPoints}<span className="text-xs text-white/50 font-bold ml-1">PTS</span>
            </p>
            <p className="text-xs font-bold text-white/50 mt-1">RANK #{loadingState ? '…' : myRank}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-white/50 mb-2">
            <span>{pickedCount}/{matches.length} matches picked</span>
            <span className="text-sabi">{lockedInPoints} pts locked in</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-sabi rounded-full transition-all duration-500"
              style={{ width: `${matches.length ? (pickedCount / matches.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-white/50 bg-white/5 border border-white/5 rounded-xl px-3 py-2.5">
          <Info className="w-4 h-4 shrink-0 text-sabi mt-px" />
          <span>Picks lock at kickoff. Home +10 · Draw +12 · Away +15. Wrong picks settle at −5 later.</span>
        </div>
      </section>

      {earnedFlash && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-sabi text-black font-black text-sm px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(193,255,0,0.5)] animate-bounce">
          {earnedFlash} earned!
        </div>
      )}

      {notice && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-semibold rounded-xl px-4 py-3">
          {notice}
        </div>
      )}

      {/* Featured Ad / Banner */}
      {featuredAd && (
        <a href={featuredAd.link} target="_blank" rel="noreferrer" className="block w-full relative rounded-[28px] overflow-hidden group cursor-pointer bg-sabi h-44 flex shadow-lg">
          <div className="absolute top-2 left-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">
            Ad
          </div>
          <div className="w-2/3 p-5 flex flex-col justify-center z-10">
            <h2 className="text-black font-black text-2xl leading-[1.1] tracking-tighter uppercase mb-2 w-4/5">
              {featuredAd.text}
            </h2>
            <div>
              <span className="bg-black text-sabi font-bold text-sm px-5 py-2.5 rounded-full inline-block">
                Pick now
              </span>
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2">
            <img src={featuredAd.imageUrl} alt="Ad" className="w-full h-full object-cover rounded-l-[50px] shadow-[-10px_0_20px_rgba(0,0,0,0.3)]" />
          </div>
        </a>
      )}

      {/* Top Events Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-sabi fill-sabi" />
            Top events
          </h2>
          <span className="text-sm font-semibold text-white bg-white/10 px-3 py-1.5 rounded-full">
            EPL · {matches.length} fixtures
          </span>
        </div>

        {/* Scoring legend */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
          {SCORING_LEGEND.map((s) => (
            <div key={s.label} className="shrink-0 bg-[#212124] border border-white/5 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-sm font-bold">{s.label}</span>
              <span className="text-xs font-black text-sabi">{s.points}</span>
            </div>
          ))}
          <div className="shrink-0 flex items-center gap-2 bg-[#1c1c1f] px-4 py-2 rounded-full text-white/40">
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">Basketball soon</span>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-[#1c1c1f] px-4 py-2 rounded-full text-white/40">
            <Swords className="w-4 h-4" />
            <span className="text-sm font-semibold">MMA soon</span>
          </div>
        </div>

        {/* Matches List */}
        <div className="flex flex-col gap-4 mt-2">
          {matches.map((match) => {
            const kickoffMs = new Date(match.kickoffTime).getTime()
            const locked = kickoffMs <= Date.now()
            const myPick = picksByMatch.get(match.id)
            const earned = myPick ? pointsForPrediction(myPick.predictedResult as Prediction) : 0

            return (
              <div key={match.id} className={`rounded-[24px] p-4 flex flex-col gap-5 shadow-sm border ${locked ? 'bg-[#141416] border-white/5 opacity-80' : 'bg-[#1c1c1f] border-white/5'}`}>

                {/* Card Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/60">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Soccer · Premier League</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${locked ? 'text-red-400' : 'text-white/60'}`}>
                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span className="text-xs font-semibold tracking-wider">
                      {locked ? 'Locked' : timeUntil(match.kickoffTime)}
                    </span>
                  </div>
                </div>

                {/* Teams */}
                <div className="flex justify-between items-center px-2">
                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-inner overflow-hidden">
                      <span className="font-black text-xl text-black/80">{match.homeTeam.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-sm text-center line-clamp-1">{match.homeTeam}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center w-1/3 gap-1">
                    <div className="text-2xl font-black text-white/80">VS</div>
                    <span className="text-xs text-white/40 font-medium">
                      {new Date(match.kickoffTime).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                      {new Date(match.kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {match.id === matches[0]?.id && !locked && (
                      <div className="mt-1 bg-sabi/10 border border-sabi/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-sabi animate-pulse" />
                        <span className="text-[10px] text-sabi font-bold uppercase tracking-wider">Featured</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 w-1/3">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-inner overflow-hidden">
                      <span className="font-black text-xl text-black/80">{match.awayTeam.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-sm text-center line-clamp-1">{match.awayTeam}</span>
                  </div>
                </div>

                {/* Earned badge */}
                {myPick && (
                  <div className="flex items-center gap-2 bg-sabi/10 border border-sabi/25 rounded-xl px-3 py-2">
                    <BadgeCheck className="w-4 h-4 text-sabi" />
                    <span className="text-xs font-bold text-sabi">
                      Picked {myPick.predictedResult.toUpperCase()} · +{earned} PTS locked in
                    </span>
                  </div>
                )}

                {/* Pick Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['home', 'draw', 'away'] as Prediction[]).map((opt) => {
                    const active = myPick?.predictedResult === opt
                    const busy = loadingPick === `${match.id}-${opt}`
                    const label = opt === 'home' ? 'Home' : opt === 'draw' ? 'Draw' : 'Away'
                    const pts = `+${pointsForPrediction(opt)}`
                    return (
                      <button
                        key={opt}
                        onClick={() => handlePick(match.id, opt)}
                        disabled={loadingPick !== null || locked}
                        className={`h-12 transition-colors rounded-xl flex items-center justify-between px-4 group disabled:opacity-60 ${
                          active
                            ? 'bg-sabi text-black shadow-[0_0_15px_rgba(193,255,0,0.3)]'
                            : 'bg-[#27272a] hover:bg-sabi/80 hover:text-black text-white'
                        }`}
                      >
                        <span className={`font-semibold text-sm ${active ? 'text-black/60' : 'text-white/50 group-hover:text-black/60'}`}>{label}</span>
                        <span className="font-bold text-sm flex items-center gap-1">
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : locked ? <Lock className="w-3.5 h-3.5" /> : pts}
                        </span>
                      </button>
                    )
                  })}
                </div>

              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
