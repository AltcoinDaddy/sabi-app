import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { matches, ads } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { SabiLoader } from '@/components/SabiLoader'
import { ChevronRight, Clock, Flame, Loader2, Lock, BadgeCheck, Info, Trophy } from 'lucide-react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { pointsForPrediction, type Prediction } from '@/lib/scoring'
import { getStoredEmail } from '@/lib/auth'
import { readLocalPoints, writeLocalPoints } from '@/lib/useSession'
import { getMyStateFn, submitPickFn } from '@/lib/server'
import { TeamLogo } from '@/components/TeamLogo'
import { MatchSheet, type SheetMatch } from '@/components/MatchSheet'
import { ResultsModal } from '@/components/ResultsModal'
import { useNow, isLocked, formatCountdown, dayLabel, dayKey } from '@/lib/countdown'

// Public data only — personal picks/points load client-side with the
// signed-in email so every number gets its own picks and points.
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

type MyPick = { matchId: number; predictedResult: string }

function FixturesScreen() {
  const { matches, ads } = Route.useLoaderData()
  const router = useRouter()
  const now = useNow()
  const [loadingPick, setLoadingPick] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const [earnedFlash, setEarnedFlash] = useState<string | null>(null)
  const [userPicks, setUserPicks] = useState<MyPick[]>([])
  const [myPoints, setMyPoints] = useState(0)
  const [myRank, setMyRank] = useState(0)
  const [sheetMatchId, setSheetMatchId] = useState<number | null>(null)

  // Load personal state for the signed-in email
  useEffect(() => {
    const email = getStoredEmail()
    if (!email) {
      setLoadingState(false)
      return
    }
    let cancelled = false
    getMyStateFn({ data: { email } })
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

  const featuredAd = ads.find((a) => a.slotName === 'featured_spot')
  const bannerAd = ads.find((a) => a.slotName === 'fixture_banner')
  const picksByMatch = useMemo(() => new Map(userPicks.map((p) => [p.matchId, p])), [userPicks])
  const pickedCount = picksByMatch.size
  const openCount = useMemo(() => matches.filter((m) => !isLocked(m.kickoffTime, now)).length, [matches, now])
  const lockedInPoints = useMemo(
    () =>
      [...picksByMatch.values()].reduce(
        (sum, p) => sum + pointsForPrediction((p.predictedResult as Prediction) ?? 'home'),
        0,
      ),
    [picksByMatch],
  )

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: typeof matches }>()
    for (const m of matches) {
      const k = dayKey(m.kickoffTime)
      if (!map.has(k)) map.set(k, { label: dayLabel(m.kickoffTime, now), items: [] })
      map.get(k)!.items.push(m)
    }
    return [...map.values()]
  }, [matches, now])

  const sheetMatch: SheetMatch | null = useMemo(() => {
    if (sheetMatchId === null) return null
    const m = matches.find((x) => x.id === sheetMatchId)
    return m
      ? { id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam, kickoffTime: m.kickoffTime, status: m.status }
      : null
  }, [sheetMatchId, matches])

  const handlePick = async (matchId: number, prediction: Prediction) => {
    const email = getStoredEmail()
    if (!email) {
      setNotice('Sign in again to make picks.')
      return
    }
    setLoadingPick(`${matchId}-${prediction}`)
    setNotice(null)
    try {
      const res = await submitPickFn({ data: { email, matchId, prediction } })
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
    <div className="px-4 pt-4 pb-10 flex flex-col gap-6">
      <ResultsModal />

      {/* Week status */}
      <section className="bg-[#1c1c1f] border border-white/5 rounded-[24px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-sabi">Week 12 · Free to Play · No Deposit</p>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">Make your picks</h1>
          </div>
          <div className="text-right">
            {loadingState ? (
              <div className="flex flex-col items-end gap-2">
                <div className="h-8 w-20 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-3 w-14 rounded bg-white/10 animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-black text-sabi tabular-nums leading-none">{myPoints}<span className="text-xs text-white/50 font-bold ml-1">PTS</span></p>
                <p className="text-xs font-bold text-white/50 mt-1">RANK #{myRank}</p>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-white/50 mb-2">
            <span>{pickedCount}/{matches.length} matches picked</span>
            <span className="text-sabi tabular-nums">{lockedInPoints} pts locked in</span>
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
          <span>Home +10 · Draw +12 · Away +15. Picks lock at kickoff; wrong picks settle at −5.</span>
        </div>
      </section>

      {earnedFlash && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-60 bg-sabi text-black font-black text-sm px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(193,255,0,0.5)] animate-bounce">
          {earnedFlash} earned!
        </div>
      )}

      {notice && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-semibold rounded-xl px-4 py-3">
          {notice}
        </div>
      )}

      {/* Featured Ad */}
      {featuredAd && (
        <a href={featuredAd.link} target="_blank" rel="noreferrer" className="w-full relative rounded-[28px] overflow-hidden group cursor-pointer bg-sabi h-44 flex shadow-lg">
          <div className="absolute top-2 left-3 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">
            Ad
          </div>
          <div className="w-2/3 p-5 flex flex-col justify-center z-10">
            <h2 className="text-black font-black text-2xl leading-[1.1] tracking-tighter uppercase mb-2 w-4/5 line-clamp-3">
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

      {/* Fixtures grouped by day */}
      <div className="flex flex-col gap-7">
        {groups.map((g) => (
          <section key={g.label}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Flame className="w-4 h-4 text-sabi" />
              <h2 className="text-sm font-extrabold uppercase tracking-widest">{g.label}</h2>
              <span className="text-[11px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                {g.items.length} match{g.items.length === 1 ? '' : 'es'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {g.items.map((match) => {
                const locked = isLocked(match.kickoffTime, now)
                const myPick = picksByMatch.get(match.id)
                const earned = myPick ? pointsForPrediction(myPick.predictedResult as Prediction) : 0

                return (
                  <article
                    key={match.id}
                    className={`rounded-[24px] p-4 flex flex-col gap-4 shadow-sm border transition-colors ${
                      locked ? 'bg-[#141416] border-white/5' : 'bg-[#1c1c1f] border-white/5'
                    }`}
                  >
                    {/* Teams row — tap for detail sheet */}
                    <button
                      onClick={() => setSheetMatchId(match.id)}
                      className="flex items-center gap-3 text-left w-full group"
                    >
                      <TeamLogo team={match.homeTeam} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[15px] leading-tight truncate">
                          {match.homeTeam} <span className="text-white/35 font-semibold">vs</span> {match.awayTeam}
                        </p>
                        <p className="text-xs text-white/45 font-semibold mt-0.5">
                          {new Date(match.kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {locked ? (
                            <span className="text-red-400 font-bold">Locked</span>
                          ) : (
                            <span className="text-sabi font-bold tabular-nums">{formatCountdown(match.kickoffTime, now)} left</span>
                          )}
                        </p>
                      </div>
                      <TeamLogo team={match.awayTeam} size="md" />
                      <ChevronRight className="w-5 h-5 text-white/25 group-hover:text-sabi group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* Status / earned strip */}
                    {myPick ? (
                      <div className="flex items-center gap-2 bg-sabi/10 border border-sabi/25 rounded-xl px-3 py-2">
                        <BadgeCheck className="w-4 h-4 text-sabi shrink-0" />
                        <span className="text-xs font-bold text-sabi">
                          {myPick.predictedResult.toUpperCase()} · +{earned} PTS
                        </span>
                        {!locked && (
                          <span className="ml-auto text-[11px] font-semibold text-white/40">tap match to switch</span>
                        )}
                      </div>
                    ) : (
                      !locked && (
                        <div className="flex items-center gap-1.5 text-white/35 px-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">No pick yet — tap a side or open for detail</span>
                        </div>
                      )
                    )}

                    {/* Quick-pick buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {(['home', 'draw', 'away'] as Prediction[]).map((opt) => {
                        const active = myPick?.predictedResult === opt
                        const busy = loadingPick === `${match.id}-${opt}`
                        const label = opt === 'home' ? '1 · Home' : opt === 'draw' ? 'X · Draw' : '2 · Away'
                        return (
                          <button
                            key={opt}
                            onClick={() => handlePick(match.id, opt)}
                            disabled={loadingPick !== null || locked}
                            className={`h-11 transition-all rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm disabled:opacity-50 ${
                              active
                                ? 'bg-sabi text-black shadow-[0_0_15px_rgba(193,255,0,0.3)]'
                                : 'bg-[#27272a] hover:bg-sabi/80 hover:text-black text-white'
                            }`}
                          >
                            {busy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : locked ? (
                              <Lock className="w-3.5 h-3.5 opacity-60" />
                            ) : (
                              <>
                                {label}
                                <span className={`text-[11px] font-black tabular-nums ${active ? 'text-black/60' : 'text-sabi'}`}>
                                  +{pointsForPrediction(opt)}
                                </span>
                              </>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}

        {/* Fixture Banner Ad */}
        {bannerAd && (
          <a href={bannerAd.link} target="_blank" rel="noreferrer" className="block w-full relative rounded-2xl overflow-hidden group border border-white/10 bg-[#1c1c1f]">
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">Ad</div>
            <div className="h-28 w-full relative">
              <img src={bannerAd.imageUrl} alt="Ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="p-3 bg-black">
              <p className="text-sm font-bold text-white group-hover:text-sabi transition-colors">{bannerAd.text}</p>
            </div>
          </a>
        )}
      </div>

      {/* Pick-slip bar */}
      <div className="sticky bottom-4 z-40">
        <div className="bg-[#232326]/95 backdrop-blur border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="w-10 h-10 rounded-xl bg-sabi/15 border border-sabi/30 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-sabi" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold tabular-nums">
              {pickedCount}/{matches.length} picked · <span className="text-sabi">{lockedInPoints} pts</span>
            </p>
            <p className="text-[11px] font-semibold text-white/45">
              {openCount === 0
                ? 'All matches locked — good luck!'
                : pickedCount >= matches.length
                  ? 'Slip complete — hold your rank'
                  : `${openCount - pickedCount} still open before kickoff`}
            </p>
          </div>
          <Link
            to="/app/leaderboard"
            className="shrink-0 bg-sabi text-black text-sm font-extrabold px-4 py-2.5 rounded-xl hover:bg-white transition-colors flex items-center gap-1"
          >
            Board <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Detail sheet */}
      <MatchSheet
        match={sheetMatch}
        myPick={sheetMatch ? (picksByMatch.get(sheetMatch.id)?.predictedResult ?? null) : null}
        locked={sheetMatch ? isLocked(sheetMatch.kickoffTime, now) : false}
        countdown={sheetMatch ? formatCountdown(sheetMatch.kickoffTime, now) : ''}
        busyKey={loadingPick}
        onPick={handlePick}
        onClose={() => setSheetMatchId(null)}
      />
    </div>
  )
}
