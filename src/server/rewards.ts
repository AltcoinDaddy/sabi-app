import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users, weeklyPots, picks } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export const distributeRewardsFn = createServerFn({ method: 'POST' })
  .validator((data: { matchWeekId: string }) => data)
  .handler(async ({ data }) => {
    // 1. Fetch the weekly pot
    const potRows = await db.select().from(weeklyPots).where(eq(weeklyPots.matchWeekId, data.matchWeekId)).limit(1)
    const pot = potRows[0]
    
    if (!pot) return { success: false as const, error: 'Pot not found for this week' }
    if (pot.status === 'DISTRIBUTED') return { success: false as const, error: 'Pot already distributed' }
    
    const potTotal = pot.potSize
    if (potTotal === 0) return { success: false as const, error: 'Pot size is zero' }

    // 2. Query the finalized leaderboard for this week
    const leaderboardRaw = await db.execute(sql`
      SELECT u.id, u.email, COALESCE(SUM(p.points_awarded), 0)::int as points
      FROM users u
      LEFT JOIN picks p ON u.id = p.user_id AND p.match_week_id = ${data.matchWeekId}
      GROUP BY u.id, u.email
      ORDER BY points DESC
      LIMIT 10
    `)
    
    // Check if anyone actually scored points
    if (leaderboardRaw.length === 0 || (leaderboardRaw[0].points as number) === 0) {
      await db.update(weeklyPots).set({ status: 'DISTRIBUTED' }).where(eq(weeklyPots.id, pot.id))
      return { success: true as const, message: 'No points earned this week. Rolled over.' }
    }

    // 3. Distribution Rules (50% to Rank 1, 50% split among Rank 2-10)
    const firstPlacePrize = Math.floor(potTotal * 0.5)
    
    // Determine how many runners-up actually exist and have points
    const runnersUp = leaderboardRaw.slice(1).filter(r => (r.points as number) > 0)
    const runnerUpPrize = runnersUp.length > 0 ? Math.floor((potTotal * 0.5) / runnersUp.length) : 0

    // 4. Ledger Crediting
    for (let i = 0; i < leaderboardRaw.length; i++) {
      const userRow = leaderboardRaw[i]
      if ((userRow.points as number) === 0) continue

      const userId = userRow.id as number
      const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (!existingUser[0]) continue
      
      const u = existingUser[0]

      if (i === 0) {
        // Rank 1: 50%
        await db.update(users).set({
          withdrawableBalance: u.withdrawableBalance + firstPlacePrize,
          lifetimeEarned: u.lifetimeEarned + firstPlacePrize
        }).where(eq(users.id, userId))
        
        console.log(`[Rewards] Credited Rank 1 (${u.email}) with ₦${firstPlacePrize}`)
      } else {
        // Rank 2-10: Share 50%
        await db.update(users).set({
          withdrawableBalance: u.withdrawableBalance + runnerUpPrize,
          lifetimeEarned: u.lifetimeEarned + runnerUpPrize
        }).where(eq(users.id, userId))
        
        console.log(`[Rewards] Credited Rank ${i + 1} (${u.email}) with ₦${runnerUpPrize}`)
      }
    }

    // 5. Mark Pot Distributed
    await db.update(weeklyPots).set({ status: 'DISTRIBUTED' }).where(eq(weeklyPots.id, pot.id))

    return { success: true as const, message: `Successfully distributed ₦${potTotal} across ${leaderboardRaw.length} players.` }
  })
