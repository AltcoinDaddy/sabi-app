import { createFileRoute } from '@tanstack/react-router'
import { getMyProfileFn, processWithdrawalFn } from '@/lib/server'
import { getStoredEmail, maskEmail } from '@/lib/auth'
import { User, Trophy, CheckCircle, XCircle, Clock, ArrowRight, Building, Smartphone, Wifi, Wallet } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/app/profile')({
  loader: async () => {
    const email = getStoredEmail()
    if (!email) throw new Error('Not logged in')
    return await getMyProfileFn({ data: { email } })
  },
  component: ProfileScreen,
  pendingComponent: () => <div className="p-8 text-center text-white/50 animate-pulse">Loading profile...</div>
})

function ProfileScreen() {
  const { me, myPoints, myRank, seasonRank, history, ads } = Route.useLoaderData()
  const [withdrawStep, setWithdrawStep] = useState<'IDLE' | 'AMOUNT' | 'METHOD' | 'DETAILS' | 'SUCCESS'>('IDLE')
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0)
  const [withdrawMethod, setWithdrawMethod] = useState<'BANK' | 'MOMO' | 'AIRTIME' | 'CRYPTO'>('BANK')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination) return
    setLoading(true)
    const res = await processWithdrawalFn({ data: { 
      email: me.email, 
      amount: withdrawAmount, 
      method: withdrawMethod, 
      destination 
    }})
    setLoading(false)
    if (res.success) {
      setWithdrawStep('SUCCESS')
    }
  }
  
  const profileAd = ads?.find(a => a.slotName === 'fixture_banner' || a.slotName === 'featured_spot')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Profile Card */}
      <div className="px-6 pt-12 pb-8 bg-linear-to-b from-sabi/10 to-[#0d0d0f] border-b border-white/5">
        <div className="w-20 h-20 bg-[#1c1c1f] rounded-full border border-sabi/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(193,255,0,0.15)]">
          <User className="w-10 h-10 text-sabi" />
        </div>
        <h1 className="text-2xl font-black text-center mb-1">
          {maskEmail(me.email)}
        </h1>
        <p className="text-center text-white/40 text-sm font-semibold uppercase tracking-widest">
          Joined {new Date(me.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="bg-[#1c1c1f] rounded-2xl p-5 border border-white/5">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Weekly Rank</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">#{myRank}</span>
            <span className="text-sabi text-sm font-bold mb-1">{myPoints} pts</span>
          </div>
        </div>
        <div className="bg-[#1c1c1f] rounded-2xl p-5 border border-white/5">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Season Rank</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">#{seasonRank}</span>
            <Trophy className="w-5 h-5 text-white/20 mb-1" />
          </div>
        </div>
      </div>

      {/* Wallet Stats (Industrial Style) */}
      <div className="mx-4 mt-2 mb-4 p-5 bg-[#0d0d0f] rounded border border-white/10 shadow-sm">
        <div className="flex justify-between items-end border-b border-white/5 pb-4 mb-4">
          <div>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">Withdrawable Balance</p>
            <p className="text-3xl font-mono text-white">₦{me.withdrawableBalance.toLocaleString()}</p>
          </div>
          {me.withdrawableBalance > 0 && withdrawStep === 'IDLE' && (
            <button 
              onClick={() => {
                setWithdrawAmount(me.withdrawableBalance)
                setWithdrawStep('AMOUNT')
              }}
              className="bg-white text-black px-4 py-2 text-xs font-bold uppercase rounded hover:bg-white/80 transition-colors"
            >
              Withdraw
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-1">Lifetime Earned</p>
            <p className="text-lg font-mono text-white/80">₦{me.lifetimeEarned.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Withdrawal State Machine (Industrial Modal) */}
      {withdrawStep !== 'IDLE' && (
        <div className="mx-4 mb-8 bg-[#0d0d0f] border border-white/20 rounded p-6 font-mono">
          
          {/* STEP 1: AMOUNT */}
          {withdrawStep === 'AMOUNT' && (
            <div className="space-y-6">
              <h2 className="text-sm uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Step 1: Enter Amount</h2>
              <div>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Math.min(me.withdrawableBalance, Number(e.target.value)))}
                  className="w-full bg-transparent border-b-2 border-white/20 h-16 text-4xl text-white outline-none focus:border-t-transparent transition-colors"
                />
              </div>
              <button 
                onClick={() => setWithdrawStep('METHOD')}
                disabled={withdrawAmount <= 0}
                className="w-full bg-white text-black font-bold h-12 rounded uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: METHOD */}
          {withdrawStep === 'METHOD' && (
            <div className="space-y-6">
              <h2 className="text-sm uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">Step 2: Select Route</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'BANK', icon: Building, label: 'Bank Transfer' },
                  { id: 'MOMO', icon: Smartphone, label: 'Mobile Money' },
                  { id: 'AIRTIME', icon: Wifi, label: 'Airtime/Data' },
                  { id: 'CRYPTO', icon: Wallet, label: 'Web3 Wallet' }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => {
                      setWithdrawMethod(m.id as any)
                      setWithdrawStep('DETAILS')
                      setDestination('')
                    }}
                    className="border border-white/10 rounded p-4 flex flex-col items-center gap-3 hover:bg-white/5 hover:border-white/30 transition-all text-white"
                  >
                    <m.icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {withdrawStep === 'DETAILS' && (
            <form onSubmit={handleWithdrawal} className="space-y-6">
              <h2 className="text-sm uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">
                Step 3: Destination ({withdrawMethod})
              </h2>
              <div>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={
                    withdrawMethod === 'BANK' ? "NUBAN Account Number" :
                    withdrawMethod === 'MOMO' ? "Opay/Palmpay Number" :
                    withdrawMethod === 'AIRTIME' ? "Phone Number" :
                    "0x... Wallet Address"
                  }
                  className="w-full bg-[#1c1c1f] border border-white/20 h-12 px-4 text-white text-sm outline-none focus:border-t-transparent transition-colors font-mono"
                />
              </div>
              <button 
                type="submit"
                disabled={loading || !destination}
                className="w-full bg-white text-black font-bold h-12 rounded uppercase tracking-widest disabled:opacity-30"
              >
                {loading ? 'Processing...' : 'Confirm Transaction'}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {withdrawStep === 'SUCCESS' && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-16 h-16 text-white mx-auto" />
              <div>
                <h2 className="text-xl font-bold tracking-widest uppercase">Transaction Pending</h2>
                <p className="text-xs text-white/50 mt-2">
                  Your funds are on the way. Fiat gateways may take 3-5 minutes to clear.
                </p>
              </div>
              <button 
                onClick={() => {
                  setWithdrawStep('IDLE')
                  window.location.reload()
                }}
                className="mt-4 border border-white/20 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-white/10"
              >
                Close
              </button>
            </div>
          )}

        </div>
      )}

      {/* History */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold mb-4">Pick History</h2>
        
        {history.length === 0 ? (
          <div className="bg-[#1c1c1f] rounded-2xl p-8 text-center border border-white/5">
            <p className="text-white/50 text-sm">You haven't made any picks yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(pick => (
              <div key={pick.id} className="bg-[#1c1c1f] rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-bold mb-1">
                    {pick.match?.homeTeam} vs {pick.match?.awayTeam}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm bg-white/10 px-2 py-1 rounded">
                      Picked: {pick.predictedResult.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {pick.status === 'won' ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-sabi mb-1" />
                      <span className="text-sabi text-xs font-bold">+10</span>
                    </>
                  ) : pick.status === 'lost' ? (
                    <>
                      <XCircle className="w-5 h-5 text-red-500 mb-1" />
                      <span className="text-red-500 text-xs font-bold">-5</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-white/30 mb-1" />
                      <span className="text-white/40 text-[10px] font-bold uppercase">Pending</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Ad Slot */}
      {profileAd && (
        <a href={profileAd.link} target="_blank" rel="noreferrer" className="block mx-4 mt-2 mb-8 relative rounded-2xl overflow-hidden group border border-white/10 bg-[#1c1c1f]">
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">Ad</div>
          <div className="h-28 w-full relative">
            <img src={profileAd.imageUrl} alt="Ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="p-3 bg-black flex justify-between items-center">
            <p className="text-sm font-bold text-white group-hover:text-sabi transition-colors line-clamp-1">{profileAd.text}</p>
          </div>
        </a>
      )}

    </div>
  )
}
