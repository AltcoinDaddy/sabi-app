import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Mail, ArrowRight, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react'
import { getStoredEmail, setStoredEmail } from '@/lib/auth'
import { sendEmailOtpFn, verifyOtpFn } from '@/lib/server'

export const Route = createFileRoute('/auth')({
  component: AuthScreen,
})

function AuthScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // If already signed in, skip the gate
  useEffect(() => {
    const existing = getStoredEmail()
    if (existing && existing.includes('@')) {
      navigate({ to: '/app' })
    }
  }, [navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const emailValid = email.includes('@') && email.length > 3

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailValid) return
    setLoading(true)
    setError(null)
    
    try {
      const res = await sendEmailOtpFn({ data: { email } })
      setLoading(false)
      
      if (res.success) {
        setStep('otp')
        setCooldown(30)
      } else {
        setError(res.error || 'Failed to send OTP')
      }
    } catch (err) {
      setLoading(false)
      setError('Network error.')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    setError(null)

    try {
      const res = await verifyOtpFn({ data: { email, code: otp } })
      setLoading(false)

      if (res.success) {
        setStoredEmail(email.trim().toLowerCase())
        navigate({ to: '/app' })
      } else {
        setError(res.error || 'Invalid code.')
      }
    } catch (err) {
      setLoading(false)
      setError('Network error.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-sabi/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 relative z-10">
        {step === 'email' ? (
          <>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 bg-[#1c1c1f] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3">What&apos;s your email?</h1>
              <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[300px] mx-auto">
                No passwords. We&apos;ll email you a 6-digit secure login code to enter the app.
              </p>
            </div>

            <form onSubmit={handleSendCode} className="flex flex-col gap-6">
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="name@example.com"
                  className="w-full bg-[#1c1c1f] border-2 border-white/5 text-white rounded-2xl h-16 px-4 text-lg font-bold outline-none focus:ring-1 focus:ring-sabi transition-colors shadow-inner"
                  autoFocus
                />
              </div>

              <Button
                disabled={!emailValid || loading}
                type="submit"
                className="w-full h-16 bg-sabi hover:bg-white text-black text-lg font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 group"
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
                setStep('email')
                setOtp('')
                setError(null)
              }}
              className="flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-white mb-8 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Change email
            </button>

            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-[#1c1c1f] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-3">Check your inbox</h1>
              <p className="text-white/60 font-medium text-sm leading-relaxed max-w-[300px] mx-auto">
                We sent a 6-digit code to <strong className="text-white">{email}</strong>.
              </p>
              <p className="mt-3 inline-block text-xs font-bold text-white/50 border border-white/10 px-3 py-1.5 rounded-full">
                Use <span className="text-white">123456</span> for local testing
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-6 items-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="size-12 text-xl font-black rounded-2xl border-2 border-white/10 bg-[#1c1c1f] text-white data-[active=true]:ring-2 data-[active=true]:ring-[#25D366]"
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
                disabled={otp.length !== 6 || loading}
                type="submit"
                className="w-full h-16 bg-sabi hover:bg-white text-black text-lg font-bold rounded-2xl transition-all disabled:opacity-50"
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
