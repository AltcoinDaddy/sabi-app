import { createFileRoute, Link } from '@tanstack/react-router'
import { Trophy, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative font-sans text-white flex flex-col overflow-hidden"
      style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
    >
      {/* Dynamic Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-linear-to-r from-black/95 via-black/80 to-black/30 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex items-center gap-3 text-2xl font-bold group">
          <div className="relative">
            <div className="absolute inset-0 bg-sabi blur-md opacity-50 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <Trophy className="text-sabi h-8 w-8 relative z-10 drop-shadow-[0_0_10px_rgba(193,255,0,0.8)]" />
          </div>
          <span className="tracking-tight text-white">Sabi</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 text-sm font-semibold tracking-wide">
          <a href="#how-it-works" className="text-white/70 hover:text-sabi transition-colors">How it Works</a>
          <a href="#prizes" className="text-white/70 hover:text-sabi transition-colors">Prizes</a>
          <a href="#leaderboard" className="text-white/70 hover:text-sabi transition-colors">Leaderboard</a>
          <a href="#advertise" className="text-white/70 hover:text-sabi transition-colors">Advertise</a>
        </div>

        <Link to="/auth">
          <Button className="bg-sabi text-black hover:bg-white hover:text-black rounded-full px-8 py-6 text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_20px_color-mix(in_oklab,var(--color-sabi)_40%,transparent)]">
            Enter App
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 text-center pb-20 max-w-screen-xl mx-auto w-full mt-10">
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto">
          Free to Play.<br />
          <span className="text-transparent bg-clip-text bg-linear-to-b from-white to-white/40">No Deposit</span><br />
          <span className="text-sabi drop-shadow-[0_0_40px_rgba(193,255,0,0.2)]">Required.</span>
        </h1>

        <p className="text-xl sm:text-2xl text-white/50 leading-relaxed font-medium mb-12 max-w-2xl mx-auto">
          Predict real-world match winners, climb the weekly leaderboard, and win Cash, Data, or Airtime—without spending a single kobo.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/auth">
            <Button className="group bg-white text-black hover:bg-gray-200 text-lg font-bold h-14 px-10 rounded-full transition-all duration-300 ease-out hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Make Your Picks
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#leaderboard">
            <Button className="h-14 px-10 rounded-full border border-white/10 bg-black/50 hover:bg-white/10 text-white text-lg font-bold transition-all duration-300">
              View Leaderboard
            </Button>
          </a>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm font-semibold text-white/40 border-t border-white/10 pt-10 w-full max-w-3xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sabi" />
            <span>100% Free Forever</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sabi" />
            <span>Instant Prize Payouts</span>
          </div>
        </div>

      </main>
    </div>
  )
}
