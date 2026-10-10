import { Trophy } from 'lucide-react'

export function SabiLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[50vh] gap-6 w-full">
      <div className="relative">
        <div className="absolute inset-0 bg-sabi blur-xl opacity-40 animate-pulse rounded-full w-16 h-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        <Trophy className="text-sabi h-16 w-16 relative z-10 drop-shadow-[0_0_15px_rgba(193,255,0,0.8)] animate-bounce" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="font-black text-xl text-white tracking-widest uppercase animate-pulse">Sabi</p>
        <p className="text-sm font-semibold text-white/50 tracking-wide">Loading fixtures...</p>
      </div>
    </div>
  )
}
