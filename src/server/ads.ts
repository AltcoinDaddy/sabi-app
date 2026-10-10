import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { ads, weeklyPots } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getNextIsoWeek } from './utils'

export const AD_SLOTS = [
  { slotName: 'fixture_banner', label: 'Fixture Banner', desc: 'Inline between upcoming matches.', price: '₦5,000/wk' },
  { slotName: 'leaderboard_takeover', label: 'Leaderboard Takeover', desc: 'Premium spot above the weekly ranking.', price: '₦15,000/wk' },
  { slotName: 'featured_spot', label: 'Featured Spot', desc: 'Large high-visibility home placement.', price: '₦50,000/wk' },
] as const

export const publishAdFn = createServerFn({ method: 'POST' })
  .validator((data: { slotName: string; imageUrl: string; link: string; text: string }) => data)
  .handler(async ({ data }) => {
    const slotName = data.slotName.trim()
    const text = data.text.trim()
    if (!slotName || !text) return { success: false as const, reason: 'missing-fields' }
    await db.update(ads).set({ active: false }).where(eq(ads.slotName, slotName))
    const created = await db
      .insert(ads)
      .values({
        slotName,
        imageUrl: data.imageUrl.trim() || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
        link: data.link.trim() || 'https://example.com',
        text,
        active: true,
      })
      .returning()

    // The Prepaid Ad Funding Loop
    const priceString = AD_SLOTS.find((s) => s.slotName === slotName)?.price || '0'
    const priceAmount = parseInt(priceString.replace(/[^0-9]/g, '')) || 0
    const potContribution = Math.floor(priceAmount * 0.4) // 40% allocated to pot

    if (potContribution > 0) {
      const nextWeek = getNextIsoWeek()
      const existingPot = await db.select().from(weeklyPots).where(eq(weeklyPots.matchWeekId, nextWeek)).limit(1)
      if (existingPot[0]) {
        await db.update(weeklyPots).set({ potSize: existingPot[0].potSize + potContribution }).where(eq(weeklyPots.id, existingPot[0].id))
      } else {
        await db.insert(weeklyPots).values({ matchWeekId: nextWeek, potSize: potContribution })
      }
    }

    return { success: true as const, ad: created[0] }
  })
