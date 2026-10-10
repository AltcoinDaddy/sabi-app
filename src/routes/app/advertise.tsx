import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Megaphone, Image as ImageIcon, Link as LinkIcon, Type, Loader2, BadgeCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AD_SLOTS, publishAdFn } from '@/lib/server'
import { useRouter } from '@tanstack/react-router'

export const Route = createFileRoute('/app/advertise')({
  component: AdvertiseScreen,
})

function AdvertiseScreen() {
  const router = useRouter()
  const [selected, setSelected] = useState<string>('fixture_banner')
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80')
  const [copy, setCopy] = useState('MockPay — Fast Transfers, Zero Fees')
  const [link, setLink] = useState('https://example.com')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  const slot = AD_SLOTS.find((s) => s.slotName === selected) ?? AD_SLOTS[0]

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!copy.trim()) {
      setError('Add your ad copy text first.')
      return
    }
    setPublishing(true)
    setError(null)
    try {
      const res = await publishAdFn({ data: { slotName: selected, imageUrl, link, text: copy } })
      if (!res.success) {
        setError('Publish failed — fill the required fields and retry.')
        return
      }
      setLive(true)
      await router.invalidate()
      setTimeout(() => setLive(false), 4000)
    } catch {
      setError('Publish failed — check your connection and retry.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-sabi/20 flex items-center justify-center mx-auto mb-4">
          <Megaphone className="h-6 w-6 text-sabi" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Self-Serve Ads</h1>
        <p className="text-white/70 text-sm">Reach thousands of highly engaged football fans. Buy a placement and go live instantly.</p>
      </div>

      {live && (
        <div className="bg-sabi/10 border border-sabi/30 text-sabi text-sm font-bold rounded-xl px-4 py-3 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" /> Your ad is live in {slot.label}!
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-semibold rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-lg">1 · Pick a placement</h2>
        {AD_SLOTS.map((s) => (
          <div
            key={s.slotName}
            className={`border rounded-2xl p-4 flex flex-col gap-4 transition-colors ${
              selected === s.slotName ? 'bg-sabi/5 border-sabi/40' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-sabi">{s.label}</h3>
                <p className="text-xs text-white/50 mt-1">{s.desc}</p>
              </div>
              <span className="font-bold bg-white/10 px-2 py-1 rounded text-sm whitespace-nowrap">{s.price}</span>
            </div>
            <Button
              onClick={() => setSelected(s.slotName)}
              className={`w-full font-bold ${selected === s.slotName ? 'bg-sabi text-black hover:bg-white' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              {selected === s.slotName ? 'Selected' : 'Select'}
            </Button>
          </div>
        ))}
      </div>

      <form onSubmit={handlePublish} className="flex flex-col gap-3">
        <h2 className="font-bold text-lg mt-2">2 · Build your ad</h2>
        <label className="flex items-center gap-3 h-14 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-sabi transition-colors">
          <ImageIcon className="w-4 h-4 text-white/40 shrink-0" />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Banner image URL"
            className="bg-transparent outline-none text-sm w-full placeholder:text-white/30 font-medium"
            inputMode="url"
          />
        </label>
        <label className="flex items-center gap-3 h-14 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-sabi transition-colors">
          <Type className="w-4 h-4 text-white/40 shrink-0" />
          <input
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
            placeholder="Primary copy text"
            maxLength={60}
            className="bg-transparent outline-none text-sm w-full placeholder:text-white/30 font-medium"
          />
        </label>
        <label className="flex items-center gap-3 h-14 bg-white/5 border border-white/10 rounded-xl px-4 focus-within:border-sabi transition-colors">
          <LinkIcon className="w-4 h-4 text-white/40 shrink-0" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Destination URL"
            className="bg-transparent outline-none text-sm w-full placeholder:text-white/30 font-medium"
            inputMode="url"
          />
        </label>

        <h2 className="font-bold text-sm uppercase tracking-wider text-white/50 mt-4 mb-1">Live preview · {slot.label}</h2>
        {selected === 'leaderboard_takeover' ? (
          <div className="w-full relative rounded-xl overflow-hidden border border-sabi/40 h-24">
            <div className="absolute top-1 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">Ad · Preview</div>
            {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover opacity-70" /> : <div className="w-full h-full bg-white/5" />}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <p className="font-bold text-white tracking-wide px-4 text-center">{copy || 'Your copy here'}</p>
            </div>
          </div>
        ) : (
          <div className="w-full relative rounded-[28px] overflow-hidden bg-sabi h-44 flex">
            <div className="absolute top-2 left-3 bg-black/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white/80 z-10">Ad · Preview</div>
            <div className="w-2/3 p-5 flex flex-col justify-center z-10">
              <h2 className="text-black font-black text-xl leading-tight tracking-tighter uppercase mb-4 line-clamp-3">{copy || 'Your copy here'}</h2>
              <span className="bg-black text-sabi font-bold text-sm px-5 py-2.5 rounded-full inline-block w-fit">Pick now</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-black/10">
              {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover rounded-l-[50px]" /> : null}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={publishing}
          className="w-full h-14 bg-sabi hover:bg-white text-black font-bold rounded-2xl mt-2"
        >
          {publishing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing…</>
          ) : (
            <>Publish to {slot.label} · {slot.price}</>
          )}
        </Button>
        <a
          href={link.startsWith('http') ? link : `https://${link}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white/40 hover:text-sabi"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Test destination link
        </a>
      </form>
    </div>
  )
}
