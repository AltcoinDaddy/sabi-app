import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Crown, Medal, Banknote, Smartphone } from 'lucide-react'
import { SabiLoader } from '@/components/SabiLoader'
import { getBoardFn } from '@/lib/server'
import { getStoredPhone } from '@/lib/auth'

export const Route = createFileRoute('/app/leaderboard')({
  component: LeaderboardScreen,
  loader: () => getBoardFn(),
  pendingComponent: SabiLoader,
})

function prizeFor(rank: number) {
  if (rank === 1) return { label: 'Cash', icon: Banknote, cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' }
  if (rank <= 10) return { label: 'Airtime', icon: Smartphone, cls: 'bg-sabi/10 text-sabi border-sabi/25' }
  return null
}

function LeaderboardScreen() {
  const { entries, season, ad } = Route.useLoaderData()
  const [tab, setTab] = useState<'weekly' | 'season'>('weekly')
  const rows = tab === 'weekly' ? entries : season
  const myDigits = (getStoredPhone() ?? '').replace(/\D/g, '').slice(-11)

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Weekly Pot Banner */}
      <div className="bg-sabi rounded-2xl p-6 text-black flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(193,255,0,0.2)]">
        <span className="uppercase font-bold tracking-widest text-xs opacity-70 mb-1">This Week&apos;s Pot</span>
        <span className="text-4xl font-extrabold tracking-tight">₦20,000*</span>
        <span className="text-xs font-semibold opacity-60 mt-1">1st = Cash · 2nd–10th = Airtime/Data</span>
      </div>

      {/* Takeover Ad */}
      {ad && (
        <a href={ad.link} target="_blank" rel="noreferrer" className="block w-full relative rounded-xl overflow-hidden border border-white/10 group cursor-pointer h-24">
          <div className="absolute top-1 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">
            Ad
          </div>
          <img src={ad.imageUrl} alt="Ad" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p className="font-bold text-white tracking-wide">{ad.text}</p>
          </div>
        </a>
      )}

      {/* Tabs */}
      <div>
        <div className="grid grid-cols-2 gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setTab('weekly')}
            className={`h-11 rounded-xl text-sm font-bold transition-colors ${tab === 'weekly' ? 'bg-sabi text-black' : 'text-white/60 hover:text-white'}`}
          >
            Weekly · Pays
          </button>
          <button
            onClick={() => setTab('season')}
            className={`h-11 rounded-xl text-sm font-bold transition-colors ${tab === 'season' ? 'bg-sabi text-black' : 'text-white/60 hover:text-white'}`}
          >
            Season · Prestige
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {tab === 'weekly' ? 'Weekly Board' : 'Season Board'}
          </h2>
          <span className="text-xs text-white/50">
            {tab === 'weekly' ? 'Top 10 win prizes · resets Mon 00:00' : 'Bragging rights only · no payout'}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((entry, index) => {
            const rank = index + 1
            const isTop3 = rank <= 3
            const isMine = myDigits.length >= 10 && entry.phoneNumber.replace(/\D/g, '').slice(-11) === myDigits
            const prize = tab === 'weekly' ? prizeFor(rank) : null
            const pts = tab === 'weekly' ? entry.points : (entry as (typeof season)[number]).seasonPoints

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  isMine
                    ? 'bg-sabi/10 border-sabi/40 shadow-[0_0_20px_rgba(193,255,0,0.15)]'
                    : isTop3
                      ? 'bg-white/10 border-white/20'
                      : rank <= 10
                        ? 'bg-white/5 border-white/5'
                        : 'bg-transparent border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      rank === 1
                        ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                        : rank === 2
                          ? 'bg-gray-300 text-black'
                          : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {rank}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium font-mono text-sm flex items-center gap-1.5">
                      {rank === 1 && tab === 'weekly' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                      {rank > 1 && rank <= 3 && <Medal className="w-3.5 h-3.5 text-white/50" />}
                      {entry.phoneNumber.slice(0, 4)}***{entry.phoneNumber.slice(-3)}
                      {isMine && (
                        <span className="text-[10px] font-black bg-sabi text-black px-2 py-0.5 rounded-full uppercase">You</span>
                      )}
                    </span>
                    {prize && (
                      <span className={`mt-1 w-fit text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 flex items-center gap-1 ${prize.cls}`}>
                        <prize.icon className="w-3 h-3" /> {prize.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-bold text-sabi tabular-nums">
                  {pts} <span className="text-[10px] text-white/50 font-medium">PTS</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
