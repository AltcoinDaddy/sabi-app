import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { matches, picks } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getCurrentIsoWeek, getCurrentSeason, needEmail } from './utils'
import { ensureUser } from './auth'
import { pointsAndRank } from './leaderboard'
import type { Prediction } from '@/lib/scoring'

/** Make or change a pick — no longer awards immediate points under the Ledger model */
export const submitPickFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; matchId: number; prediction: Prediction }) => data)
  .handler(async ({ data }) => {
    const email = needEmail(data.email)
    const user = await ensureUser(email)
    const currentWeek = getCurrentIsoWeek()
    const currentSeason = getCurrentSeason()

    const matchRows = await db.select().from(matches).where(eq(matches.id, data.matchId)).limit(1)
    const match = matchRows[0]
    if (!match) return { success: false as const, reason: 'not-found' }
    if (new Date(match.kickoffTime).getTime() <= Date.now()) {
      return { success: false as const, reason: 'locked' }
    }

    const existing = await db
      .select()
      .from(picks)
      .where(and(eq(picks.userId, user.id), eq(picks.matchId, data.matchId)))
      .limit(1)
    const already = existing[0]

    if (already) {
      await db.update(picks).set({ predictedResult: data.prediction }).where(eq(picks.id, already.id))
    } else {
      await db.insert(picks).values({
        userId: user.id,
        matchId: data.matchId,
        predictedResult: data.prediction,
        status: 'pending',
        matchWeekId: currentWeek,
        seasonId: currentSeason,
        pointsAwarded: null,
      })
    }

    const { myPoints } = await pointsAndRank(user.id)
    return { success: true as const, delta: 0, totalPoints: myPoints } // delta is 0 until match resolves
  })

/** Worker/Admin function to officially resolve a match and score all picks */
export const resolveMatchFn = createServerFn({ method: 'POST' })
  .validator((data: { matchId: number; result: string }) => data)
  .handler(async ({ data }) => {
    const matchRows = await db.select().from(matches).where(eq(matches.id, data.matchId)).limit(1)
    if (!matchRows[0]) throw new Error("Match not found")
    const match = matchRows[0]
    
    // Update match status
    await db.update(matches).set({ status: 'completed', actualResult: data.result }).where(eq(matches.id, data.matchId))

    // Score all picks for this match
    const allPicks = await db.select().from(picks).where(eq(picks.matchId, data.matchId))
    
    for (const pick of allPicks) {
      let points = -5 // Base loss
      
      if (pick.predictedResult === data.result) {
        if (data.result === match.underdogTeam) {
          points = 15 // Underdog win
        } else {
          points = 10 // Favorite / normal win
        }
      }

      await db.update(picks).set({ 
        status: 'resolved', 
        pointsAwarded: points 
      }).where(eq(picks.id, pick.id))
    }
    
    return { success: true as const, message: `Match ${data.matchId} resolved. Scored ${allPicks.length} picks.` }
  })
