import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users, withdrawals } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { needEmail } from './utils'

export const processWithdrawalFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; amount: number; method: string; destination: string }) => data)
  .handler(async ({ data }) => {
    try {
      const emailNorm = needEmail(data.email)
      const user = await db.select().from(users).where(eq(users.email, emailNorm)).limit(1)
      if (!user[0]) throw new Error('User not found')

      if (user[0].withdrawableBalance < data.amount) {
        return { success: false as const, error: 'Insufficient balance' }
      }

      // 1. Deduct immediately from balance to prevent double spending
      await db.update(users)
        .set({ withdrawableBalance: user[0].withdrawableBalance - data.amount })
        .where(eq(users.id, user[0].id))

      // 2. Create the PENDING withdrawal record
      const newWithdrawal = await db.insert(withdrawals).values({
        userId: user[0].id,
        amount: data.amount,
        method: data.method,
        destination: data.destination,
        status: 'PENDING'
      }).returning()

      const withdrawalId = newWithdrawal[0].id

      // 3. Simulate Gateway Interaction based on method
      console.log(`[Withdrawal Gateway] Processing ₦${data.amount} via ${data.method} to ${data.destination}`)
      
      // In reality, this would listen for a webhook. For now, mark COMPLETED.
      // If it failed, we would refund the balance and mark FAILED.
      await db.update(withdrawals).set({ status: 'COMPLETED' }).where(eq(withdrawals.id, withdrawalId))
      
      return { success: true as const, message: 'Withdrawal processed successfully' }
    } catch (e) {
      console.error('Withdrawal API Error:', e)
      return { success: false as const, error: 'Processing error' }
    }
  })
