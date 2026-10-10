import { useEffect, useState } from 'react'
import { Trophy, Banknote, Smartphone, Wifi, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getBoardFn } from '@/lib/server'
import { weekKey } from '@/lib/countdown'

const PRIZES = [
  { icon: Banknote, label: '₦10,000 Cash', cls: 'text-yellow-300' },
  { icon: Smartphone, label: '₦1,000 Airtime', cls: 'text-sabi' },
  { icon: Wifi, label: '500MB Data', cls: 'text-sky-300' },
]

/** PRD "Monday Results View" — first visit of each week settles last week. */
export function ResultsModal() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<{ email: string; points: number }[]>([])

  useEffect(() => {
    const key = `sabi_results_seen_${weekKey()}`
    let seen = false
    try {
      seen = window.localStorage.getItem(key) === '1'
    } catch {
      seen = true
    }
    if (seen) return
    let cancelled = false
    getBoardFn()
      .then((b) => {
        if (cancelled) return
        const played = b.entries.filter((e) => e.points > 0).slice(0, 3)
        if (played.length === 0) {
          try {
            window.localStorage.setItem(key, '1')
          } catch {}
          return
        }
        setRows(played.map((e) => ({ email: (e as any).email || (e as any).phoneNumber, points: e.points })))
        setOpen(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    try {
      window.localStorage.setItem(`sabi_results_seen_${weekKey()}`, '1')
    } catch {}
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="bg-[#161618] text-white border-white/10 max-w-sm rounded-3xl">
        <DialogHeader className="items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-sabi/15 border border-sabi/30 flex items-center justify-center mb-2">
            <Trophy className="w-7 h-7 text-sabi" />
          </div>
          <DialogTitle className="text-white text-xl font-extrabold">Last week settled</DialogTitle>
          <DialogDescription className="text-white/55 font-medium">
            Winners paid out. Fresh board, fresh pot — your turn.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          {rows.map((r, i) => {
            const P = PRIZES[i]
            return (
              <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-white/80">
                    {r.email?.includes('@') ? (r.email.split('@')[0].length <= 2 ? `${r.email.split('@')[0]}***@${r.email.split('@')[1]}` : `${r.email.split('@')[0].slice(0, 2)}***@${r.email.split('@')[1]}`) : '***'}
                  </span>
                  <span className="text-[10px] font-black text-black bg-sabi px-2 py-0.5 rounded-full">#{i + 1}</span>
                </div>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${P.cls}`}>
                  <P.icon className="w-4 h-4" /> {P.label}
                </span>
              </div>
            )
          })}
        </div>

        <Button onClick={dismiss} className="w-full h-13 py-4 mt-4 bg-sabi hover:bg-white text-black font-bold rounded-2xl">
          Make this week&apos;s picks <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
