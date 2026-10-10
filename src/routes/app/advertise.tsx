import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { publishAdFn } from '@/lib/server'
import { Megaphone, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const AD_SLOTS = [
  { slotName: 'fixture_banner', label: 'Fixture Banner', desc: 'Inline between upcoming matches.', price: '₦5,000/wk' },
  { slotName: 'leaderboard_takeover', label: 'Leaderboard Takeover', desc: 'Premium spot above the weekly ranking.', price: '₦15,000/wk' },
  { slotName: 'featured_spot', label: 'Featured Spot', desc: 'Large high-visibility home placement.', price: '₦50,000/wk' },
] as const

export const Route = createFileRoute('/app/advertise')({
  component: AdvertiseScreen,
})

function AdvertiseScreen() {
  const [selectedSlot, setSelectedSlot] = useState<string>(AD_SLOTS[0].slotName)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [link, setLink] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const res = await publishAdFn({ data: { slotName: selectedSlot, text, imageUrl, link } })
    setLoading(false)
    
    if (res.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="px-6 pt-8 pb-6 border-b border-white/5 bg-[#0d0d0f] sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-8 h-8 text-sabi" />
          <h1 className="text-3xl font-black tracking-tight">Advertise</h1>
        </div>
        <p className="text-white/60 text-sm font-medium leading-relaxed">
          Sabi is 100% funded by self-serve native ads. Publish an ad instantly and reach thousands of football fans.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 mt-6 space-y-8">
        
        {/* Select Slot */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-white/50">1. Select Placement</label>
          <div className="grid gap-3">
            {AD_SLOTS.map(slot => (
              <div 
                key={slot.slotName}
                onClick={() => setSelectedSlot(slot.slotName)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedSlot === slot.slotName ? 'bg-sabi/5 border-sabi' : 'bg-[#1c1c1f] border-white/5 hover:border-white/20'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className={`font-bold ${selectedSlot === slot.slotName ? 'text-sabi' : 'text-white'}`}>{slot.label}</p>
                  <p className="text-sm font-black text-white">{slot.price}</p>
                </div>
                <p className="text-xs text-white/50">{slot.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Details */}
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-white/50">2. Ad Details</label>
          
          <div>
            <label className="block text-sm font-medium mb-1">Ad Copy (Short)</label>
            <input 
              required
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="e.g. Save and invest today."
              className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-sabi transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input 
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg (Optional)"
              className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-sabi transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Destination Link</label>
            <input 
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://yourbrand.com (Optional)"
              className="w-full bg-[#1c1c1f] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-sabi transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <Button 
          type="submit" 
          disabled={loading || !text}
          className={`w-full h-16 text-lg font-bold rounded-2xl transition-all ${success ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-sabi text-black hover:bg-white'}`}
        >
          {loading ? 'Publishing...' : success ? (
            <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Live!</span>
          ) : 'Pay & Publish Ad'}
        </Button>
        <p className="text-center text-[10px] font-bold text-white/30 uppercase mt-2">
          MVP Note: This instantly updates the live UI
        </p>

      </form>
    </div>
  )
}
