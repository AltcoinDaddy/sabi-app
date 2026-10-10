import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { ads, leaderboardEntries, matches, picks, users } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { pointsForPrediction, type Prediction } from './scoring'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-11)
}

function validPhone(phone: unknown): phone is string {
  return typeof phone === 'string' && normalizePhone(phone).length >= 10
}

/** Find-or-create the user row for a phone number, with a board entry. */
async function ensureUser(phone: string) {
  const digits = normalizePhone(phone)
  const existing = await db.select().from(users).where(eq(users.phoneNumber, digits)).limit(1)
  if (existing[0]) return existing[0]
  const created = await db.insert(users).values({ phoneNumber: digits }).returning()
  await db.insert(leaderboardEntries).values({ userId: created[0].id, points: 0 })
  return created[0]
}

async function pointsAndRank(userId: number) {
  const all = await db.select().from(leaderboardEntries).orderBy(desc(leaderboardEntries.points))
  const myPoints = all.find((e) => e.userId === userId)?.points ?? 0
  const myRank = all.filter((e) => e.points > myPoints).length + 1
  return { myPoints, myRank }
}

const needPhone = (phone: unknown) => {
  if (!validPhone(phone)) throw new Error('phone required')
  return normalizePhone(phone)
}

/** Public board — no auth needed. */
export const getBoardFn = createServerFn({ method: 'GET' }).handler(async () => {
  const entries = await db
    .select({
      id: leaderboardEntries.id,
      userId: leaderboardEntries.userId,
      rank: leaderboardEntries.rank,
      points: leaderboardEntries.points,
      phoneNumber: users.phoneNumber,
    })
    .from(leaderboardEntries)
    .innerJoin(users, eq(leaderboardEntries.userId, users.id))
    .orderBy(desc(leaderboardEntries.points))
    .limit(20)

  const takeoverRows = await db
    .select()
    .from(ads)
    .where(and(eq(ads.slotName, 'leaderboard_takeover'), eq(ads.active, true)))
    .orderBy(desc(ads.id))
    .limit(1)

  const season = [...entries]
    .map((e, i) => ({ ...e, seasonPoints: e.points * 5 + 200 - i * 3 }))
    .sort((a, b) => b.seasonPoints - a.seasonPoints)

  return { entries, season, ad: takeoverRows[0] || null }
})

/** Personal state for the signed-in phone: picks, points, rank. */
export const getMyStateFn = createServerFn({ method: 'GET' })
  .validator((data: { phone: string }) => data)
  .handler(async ({ data }) => {
    const phone = needPhone(data.phone)
    const user = await ensureUser(phone)
    const userPicks = await db.select().from(picks).where(eq(picks.userId, user.id))
    const { myPoints, myRank } = await pointsAndRank(user.id)
    return { userId: user.id, phone: user.phoneNumber, userPicks, myPoints, myRank }
  })

/** Full profile: stats + pick history with match info. */
export const getMyProfileFn = createServerFn({ method: 'GET' })
  .validator((data: { phone: string }) => data)
  .handler(async ({ data }) => {
    const phone = needPhone(data.phone)
    const user = await ensureUser(phone)
    const { myPoints, myRank } = await pointsAndRank(user.id)
    const myPicks = await db.select().from(picks).where(eq(picks.userId, user.id))
    const allMatches = await db.select().from(matches)
    const matchMap = new Map(allMatches.map((m) => [m.id, m]))
    const history = myPicks
      .map((p) => ({ ...p, match: matchMap.get(p.matchId) ?? null }))
      .filter((p) => p.match)
      .sort((a, b) => new Date(b.match!.kickoffTime).getTime() - new Date(a.match!.kickoffTime).getTime())
    return { me: user, myPoints, myRank, seasonRank: myRank + 2, history }
  })

/** Make or change a pick — earns points immediately (prototype rule). */
export const submitPickFn = createServerFn({ method: 'POST' })
  .validator((data: { phone: string; matchId: number; prediction: Prediction }) => data)
  .handler(async ({ data }) => {
    const phone = needPhone(data.phone)
    const user = await ensureUser(phone)

    const matchRows = await db.select().from(matches).where(eq(matches.id, data.matchId)).limit(1)
    const match = matchRows[0]
    if (!match) return { success: false as const, reason: 'not-found' }
    if (new Date(match.kickoffTime).getTime() <= Date.now()) {
      return { success: false as const, reason: 'locked' }
    }

    const newPoints = pointsForPrediction(data.prediction)
    const existing = await db
      .select()
      .from(picks)
      .where(and(eq(picks.userId, user.id), eq(picks.matchId, data.matchId)))
      .limit(1)
    const already = existing[0]

    let delta = newPoints
    if (already) {
      if (already.predictedResult === data.prediction) {
        const { myPoints } = await pointsAndRank(user.id)
        return { success: true as const, delta: 0, totalPoints: myPoints }
      }
      delta = newPoints - pointsForPrediction(already.predictedResult as Prediction)
      await db.update(picks).set({ predictedResult: data.prediction }).where(eq(picks.id, already.id))
    } else {
      await db.insert(picks).values({
        userId: user.id,
        matchId: data.matchId,
        predictedResult: data.prediction,
        status: 'pending',
      })
    }

    const entries = await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.userId, user.id))
      .limit(1)
    if (entries[0]) {
      await db
        .update(leaderboardEntries)
        .set({ points: entries[0].points + delta })
        .where(eq(leaderboardEntries.userId, user.id))
    } else {
      await db.insert(leaderboardEntries).values({ userId: user.id, points: Math.max(delta, 0) })
    }

    const { myPoints } = await pointsAndRank(user.id)
    return { success: true as const, delta, totalPoints: myPoints }
  })

export const AD_SLOTS = [
  { slotName: 'fixture_banner', label: 'Fixture Banner', desc: 'Inline between upcoming matches.', price: '₦5,000/wk' },
  { slotName: 'leaderboard_takeover', label: 'Leaderboard Takeover', desc: 'Premium spot above the weekly ranking.', price: '₦15,000/wk' },
  { slotName: 'featured_spot', label: 'Featured Spot', desc: 'Large high-visibility home placement.', price: '₦50,000/wk' },
] as const

/** Publish a mock ad — it goes live into its slot immediately. */
export const publishAdFn = createServerFn({ method: 'POST' })
  .validator((data: { slotName: string; imageUrl: string; link: string; text: string }) => data)
  .handler(async ({ data }) => {
    const slotName = data.slotName.trim()
    const text = data.text.trim()
    if (!slotName || !text) return { success: false as const, reason: 'missing-fields' }
    // New ad takes over the slot so the preview matches what users see
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
    return { success: true as const, ad: created[0] }
  })
