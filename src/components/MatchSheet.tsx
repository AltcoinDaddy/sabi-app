import { Check, Clock, Flame, Loader2, Lock } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { TeamLogo } from './TeamLogo'
import { pointsForPrediction, type Prediction } from '@/lib/scoring'
import { cn } from 'cn'

export type SheetMatch = {
  id: number
  homeTeam: string
  awayTeam: string
  kickoffTime: string | Date
  status: string
}

const OPTIONS: { value: Prediction; label: string; tag: string; detail: string }[] = [
  { value: 'home', label: 'Home Win', tag: 'Favourite', detail: 'Safest call' },
  { value: 'draw', label: 'Draw', tag: 'Level', detail: 'Stalemate call' },
  { value: 'away', label: 'Away Win', tag: 'Underdog', detail: 'Bold pays more' },
]

/** Tap-a-match bottom sheet — the focused pick decision view. */
export function MatchSheet({
  match,
  myPick,
  locked,
  countdown,
  busyKey,
  onPick,
  onClose,
}: {
  match: SheetMatch | null
  myPick: string | null
  locked: boolean
  countdown: string
  busyKey: string | null
  onPick: (matchId: number, prediction: Prediction) => void
  onClose: () => void
}) {
  return (
    <Drawer open={match !== null} onOpenChange={(o) => !o && onClose()} showSwipeHandle>
      <DrawerContent className="bg-[#161618] text-white border-white/10 max-w-md mx-auto">
        {match && (
          <>
            <DrawerHeader className="items-center text-center pt-2">
              <div className="flex items-center gap-2 text-white/50">
                <Flame className="w-3.5 h-3.5 text-sabi" />
                <DrawerTitle className="text-white text-xs font-bold uppercase tracking-widest">
                  Premier League
                </DrawerTitle>
              </div>
            </DrawerHeader>

            <div className="px-5 pb-6 flex flex-col gap-5 overflow-y-auto">
              {/* Teams */}
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex flex-col items-center gap-2 w-[30%]">
                  <TeamLogo team={match.homeTeam} size="xl" />
                  <span className="font-bold text-sm text-center leading-tight">{match.homeTeam}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Home</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-black text-white/90">VS</span>
                  <span className="text-xs font-bold text-white/60">
                    {new Date(match.kickoffTime).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xs font-bold text-white/60">
                    {new Date(match.kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 w-[30%]">
                  <TeamLogo team={match.awayTeam} size="xl" />
                  <span className="font-bold text-sm text-center leading-tight">{match.awayTeam}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Away</span>
                </div>
              </div>

              {/* Lock status */}
              <div
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold border',
                  locked
                    ? 'bg-red-500/10 border-red-500/25 text-red-300'
                    : 'bg-sabi/10 border-sabi/25 text-sabi',
                )}
              >
                {locked ? <Lock className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {locked ? 'Picks locked at kickoff' : `Locks in ${countdown} — wrong picks settle at −5`}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Pick the winner</p>
                {OPTIONS.map((opt) => {
                  const active = myPick === opt.value
                  const busy = busyKey === `${match.id}-${opt.value}`
                  const pts = pointsForPrediction(opt.value)
                  return (
                    <button
                      key={opt.value}
                      disabled={locked || busyKey !== null}
                      onClick={() => onPick(match.id, opt.value)}
                      className={cn(
                        'flex items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left transition-all disabled:opacity-60',
                        active
                          ? 'bg-sabi border-sabi text-black shadow-[0_0_25px_rgba(193,255,0,0.25)]'
                          : 'bg-white/5 border-white/10 text-white active:scale-[0.99] hover:border-white/25',
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-extrabold text-base flex items-center gap-2">
                          {opt.label}
                          {active && <Check className="w-4 h-4 stroke-[3]" />}
                        </span>
                        <span className={cn('text-xs font-semibold', active ? 'text-black/60' : 'text-white/45')}>
                          {opt.tag} · {opt.detail}
                        </span>
                      </div>
                      <span className={cn(
                        'font-black text-sm px-3 py-1.5 rounded-full tabular-nums',
                        active ? 'bg-black text-sabi' : 'bg-sabi/15 text-sabi',
                      )}>
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : `+${pts}`}
                      </span>
                    </button>
                  )
                })}
              </div>

              {myPick && !locked && (
                <p className="text-center text-xs font-semibold text-white/40">
                  Locked in: <span className="text-sabi font-bold uppercase">{myPick}</span> — tap another outcome to switch
                </p>
              )}
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
