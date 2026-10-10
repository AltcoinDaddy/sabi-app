import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { ads, matches, picks, users, weeklyPots } from '@/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { getCurrentIsoWeek, getCurrentSeason, needEmail } from './utils'
import { ensureUser } from './auth'

export async function pointsAndRank(userId: number) {
  const currentWeek = getCurrentIsoWeek()
  
  // Weekly points
  const weeklyRaw = await db.execute(sql`
    SELECT u.id, COALESCE(SUM(p.points_awarded), 0)::int as points
    FROM users u
    LEFT JOIN picks p ON u.id = p.user_id AND p.match_week_id = ${currentWeek}
    GROUP BY u.id
    ORDER BY points DESC
  `)
  
  const myRowIndex = weeklyRaw.findIndex((r) => r.id === userId)
  const myPoints = myRowIndex >= 0 ? (weeklyRaw[myRowIndex].points as number) : 0
  const myRank = myRowIndex >= 0 ? myRowIndex + 1 : 9999
  
  return { myPoints, myRank }
}

/** Public board — dynamically aggregated from picks */
export const getBoardFn = createServerFn({ method: 'GET' }).handler(async () => {
  const currentWeek = getCurrentIsoWeek()
  const currentSeason = getCurrentSeason()
  
  const weeklyRaw = await db.execute(sql`
    SELECT u.id as "userId", u.email, COALESCE(SUM(p.points_awarded), 0)::int as points
    FROM users u
    LEFT JOIN picks p ON u.id = p.user_id AND p.match_week_id = ${currentWeek}
    GROUP BY u.id, u.email
    ORDER BY points DESC
    LIMIT 20
  `)
  
  const seasonRaw = await db.execute(sql`
    SELECT u.id as "userId", u.email, COALESCE(SUM(p.points_awarded), 0)::int as points
    FROM users u
    LEFT JOIN picks p ON u.id = p.user_id AND p.season_id = ${currentSeason}
    GROUP BY u.id, u.email
    ORDER BY points DESC
    LIMIT 20
  `)

  const takeoverRows = await db
    .select()
    .from(ads)
    .where(and(eq(ads.slotName, 'leaderboard_takeover'), eq(ads.active, true)))
    .orderBy(desc(ads.id))
    .limit(1)

  const potRows = await db.select().from(weeklyPots).where(eq(weeklyPots.matchWeekId, currentWeek)).limit(1)
  const potSize = potRows[0]?.potSize || 0

  const entries = weeklyRaw.map((r, i) => ({ ...r, rank: i + 1, id: r.userId as number })) as any[]
  const season = seasonRaw.map((r, i) => ({ ...r, rank: i + 1, id: r.userId as number, seasonPoints: r.points })) as any[]

  return { entries, season, ad: takeoverRows[0] || null, potSize }
})

/** Personal state for the signed-in email: picks, points, rank. */
export const getMyStateFn = createServerFn({ method: 'GET' })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = needEmail(data.email)
    const user = await ensureUser(email)
    const userPicks = await db.select().from(picks).where(eq(picks.userId, user.id))
    const { myPoints, myRank } = await pointsAndRank(user.id)
    return { userId: user.id, email: user.email, userPicks, myPoints, myRank }
  })

/** Full profile: stats + pick history with match info. */
export const getMyProfileFn = createServerFn({ method: 'GET' })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = needEmail(data.email)
    const user = await ensureUser(email)
    const { myPoints, myRank } = await pointsAndRank(user.id)
    const myPicks = await db.select().from(picks).where(eq(picks.userId, user.id))
    const allMatches = await db.select().from(matches)
    const matchMap = new Map(allMatches.map((m) => [m.id, m]))
    const history = myPicks
      .map((p) => ({ ...p, match: matchMap.get(p.matchId) ?? null }))
      .filter((p) => p.match)
      .sort((a, b) => new Date(b.match!.kickoffTime).getTime() - new Date(a.match!.kickoffTime).getTime())
    const activeAds = await db.select().from(ads).where(eq(ads.active, true))
    return { me: user, myPoints, myRank, seasonRank: myRank + 2, history, ads: activeAds }
  })
