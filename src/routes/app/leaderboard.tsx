import { createFileRoute } from '@tanstack/react-router'
import { getBoardFn } from '@/lib/server'
import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { maskEmail } from '@/lib/auth'

export const Route = createFileRoute('/app/leaderboard')({
  loader: async () => await getBoardFn(),
  component: LeaderboardScreen,
  pendingComponent: () => <div className="p-8 text-center text-white/50 animate-pulse">Loading board...</div>
})

function LeaderboardScreen() {
  const data = Route.useLoaderData()
  const [tab, setTab] = useState<'weekly' | 'season'>('weekly')

  const list = tab === 'weekly' ? data.entries : data.season
  const ad = data.ad

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 border-b border-white/5 bg-[#0d0d0f] sticky top-0 z-10">
        <h1 className="text-3xl font-black tracking-tight mb-2">Leaderboard</h1>
        <p className="text-white/60 text-sm font-medium">Climb the ranks. Win real prizes.</p>
      </div>

      {/* Dynamic Pot Announcement */}
      {tab === 'weekly' && (
        <div className="mx-4 mt-6 bg-linear-to-br from-sabi/20 to-transparent border border-sabi/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-sabi/20 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sabi text-xs font-bold uppercase tracking-widest mb-1">This Week's Pot</p>
              <p className="text-3xl font-black text-white">
                {data.potSize > 0 ? `₦${data.potSize.toLocaleString()}` : 'Funding...'}
              </p>
            </div>
            <Trophy className="w-10 h-10 text-sabi" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mx-4 mt-6 bg-[#1c1c1f] rounded-full p-1 border border-white/5">
        <button 
          onClick={() => setTab('weekly')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${tab === 'weekly' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}
        >
          Weekly (Payouts)
        </button>
        <button 
          onClick={() => setTab('season')}
          className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${tab === 'season' ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'}`}
        >
          Season (Prestige)
        </button>
      </div>

      {/* Ad Takeover */}
      {ad && (
        <a href={ad.link} target="_blank" rel="noreferrer" className="block mx-4 mt-6 bg-[#1c1c1f] rounded-2xl overflow-hidden border border-white/10 group">
          <div className="h-32 w-full relative">
            <img src={ad.imageUrl} alt={ad.slotName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-[9px] font-bold uppercase px-2 py-1 rounded text-white/70">Ad</div>
          </div>
          <div className="p-3">
            <p className="text-sm font-bold text-white group-hover:text-sabi transition-colors">{ad.text}</p>
          </div>
        </a>
      )}

      {/* List */}
      <div className="px-4 py-6 space-y-2">
        {list.map((entry, idx) => {
          const isFirst = idx === 0;
          const isWinner = tab === 'weekly' && idx < 10;
          
          return (
            <div key={entry.id} className={`flex items-center justify-between p-4 rounded-2xl border ${isFirst ? 'bg-sabi/5 border-sabi/20' : 'bg-[#1c1c1f] border-white/5'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 text-center font-black ${isFirst ? 'text-sabi text-xl' : 'text-white/40 text-base'}`}>
                  #{idx + 1}
                </div>
                <div>
                  <p className="font-bold text-white">
                    {maskEmail((entry as any).email)}
                  </p>
                  {isWinner && (
                    <p className={`text-[10px] font-bold uppercase mt-0.5 ${isFirst ? 'text-sabi' : 'text-blue-400'}`}>
                      {isFirst ? '🏆 Wins ₦10,000 Cash' : '📱 Wins Data/Airtime'}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-lg">{tab === 'weekly' ? entry.points : (entry as any).seasonPoints}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase">PTS</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
