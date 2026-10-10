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
      
      const apiKey = process.env.BACHS_API_KEY || 'sk_sandbox_mock_key'
      
      if (data.method === 'BANK' || data.method === 'MOMO') {
        // Trigger Bachs API
        await fetch('https://sandbox-api.bachs.io/v1/payouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            amount: data.amount,
            currency: 'NGN',
            destination: { type: 'bank_account', account_number: data.destination, bank_code: '044' }, // Bank code normally derived
            reference: `payout_${withdrawalId}`,
            narration: 'Sabi App Weekly Prize'
          })
        })
        
        // Wait for webhook to finalize status
        await db.update(withdrawals).set({ status: 'PROCESSING' }).where(eq(withdrawals.id, withdrawalId))
      } else {
        // For non-Bachs routes like Crypto/Airtime, we just mark COMPLETED immediately for now
        await db.update(withdrawals).set({ status: 'COMPLETED' }).where(eq(withdrawals.id, withdrawalId))
      }
      
      return { success: true as const, message: 'Withdrawal processed successfully' }
    } catch (e) {
      console.error('Withdrawal API Error:', e)
      return { success: false as const, error: 'Processing error' }
    }
  })
