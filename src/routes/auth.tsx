import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Phone, ArrowRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'
import { DEMO_OTP, getStoredPhone, setStoredPhone } from '@/lib/auth'

export const Route = createFileRoute('/auth')({
  component: AuthScreen,
})

function AuthScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // If already signed in, skip the gate
  useEffect(() => {
    const existing = getStoredPhone()
    if (existing && existing.replace(/\D/g, '').length >= 10) {
      navigate({ to: '/app' })
    }
  }, [navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const phoneValid = phone.replace(/\D/g, '').length >= 10

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneValid) return
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setLoading(false)
      setStep('otp')
      setCooldown(30)
    }, 700)
  }

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 4) return
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setLoading(false)
      if (otp === DEMO_OTP) {
        setStoredPhone(phone.replace(/\D/g, ''))
        navigate({ to: '/app' })
      } else {
        setError(`That code didn't match. Hint: demo code is ${DEMO_OTP}.`)
      }
    }, 700)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-sabi/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 relative z-10">
        {step === 'phone' ? (
          <>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-[#1c1c1f] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(193,255,0,0.15)]">
                <Phone className="w-8 h-8 text-sabi" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3">What&apos;s your number?</h1>
              <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[300px] mx-auto">
                No passwords. No emails. We&apos;ll text you a 4-digit code — and send your{' '}
                <strong className="text-white">Cash &amp; Airtime</strong> prizes here when you win.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="flex flex-col gap-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-white/50 font-bold border-r border-white/10 pr-3">+234</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="801 234 5678"
                  className="w-full bg-[#1c1c1f] border-2 border-white/5 text-white rounded-2xl h-16 pl-[84px] pr-4 text-lg font-bold outline-none focus:border-sabi transition-colors placeholder:text-white/20 shadow-inner"
                  maxLength={11}
                  autoFocus
                  inputMode="numeric"
                />
              </div>

              <Button
                disabled={!phoneValid || loading}
                type="submit"
                className="w-full h-16 bg-sabi hover:bg-white text-black text-lg font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/40 group"
              >
                {loading ? (
                  <span className="animate-pulse">Sending code…</span>
                ) : (
                  <>
                    Get OTP code
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-white/40">
              <ShieldCheck className="w-4 h-4 text-sabi" />
              <span>Free to play · No deposit · We never spam</span>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError(null)
              }}
              className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white mb-8 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Change number
            </button>

            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-[#1c1c1f] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(193,255,0,0.15)]">
                <KeyRound className="w-8 h-8 text-sabi" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3">Enter your code</h1>
              <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[300px] mx-auto">
                We sent a 4-digit code to <strong className="text-white">+234 {phone}</strong>.
              </p>
              <p className="mt-3 inline-block text-xs font-bold text-black bg-sabi px-3 py-1.5 rounded-full">
                DEMO CODE: {DEMO_OTP}
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-6 items-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="size-14 text-xl font-black rounded-2xl border-2 border-white/10 bg-[#1c1c1f] text-white data-[active=true]:border-sabi"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error && (
                <p className="text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
                  {error}
                </p>
              )}

              <Button
                disabled={otp.length !== 4 || loading}
                type="submit"
                className="w-full h-16 bg-sabi hover:bg-white text-black text-lg font-bold rounded-2xl transition-all disabled:opacity-50 disabled:bg-white/10 disabled:text-white/40"
              >
                {loading ? <span className="animate-pulse">Verifying…</span> : 'Verify & Enter App'}
              </Button>

              <button
                type="button"
                disabled={cooldown > 0}
                onClick={() => setCooldown(30)}
                className="text-sm font-semibold text-white/50 hover:text-sabi disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
