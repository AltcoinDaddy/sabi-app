import { createAPIFileRoute } from '@tanstack/start/api'
import crypto from 'crypto'
import { db } from '@/db'
import { users, withdrawals, weeklyPots } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getNextIsoWeek } from '@/server/utils'

export const APIRoute = createAPIFileRoute('/api/webhooks/bachs')({
  POST: async ({ request }: { request: Request }) => {
    // 1. Get Bachs Signature from headers
    const signature = request.headers.get('x-bachs-signature') || request.headers.get('x-webhook-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 400 })
    }

    // 2. Read raw request body
    const textBody = await request.text()
    
    // 3. Verify signature using Bachs Secret Key
    const secret = process.env.BACHS_WEBHOOK_SECRET || 'sk_sandbox_mock_key'
    const hash = crypto.createHmac('sha512', secret).update(textBody).digest('hex')
    
    // In production, enforce strict signature matching.
    if (process.env.NODE_ENV === 'production' && hash !== signature) {
      return new Response('Invalid signature', { status: 401 })
    }

    // 4. Parse the event payload
    const event = JSON.parse(textBody)
    console.log(`[Bachs Webhook] Received Event: ${event.event}`)

    // Example payload structure from Bachs:
    // { event: "payout.successful", data: { reference: "payout_163820293", amount: 20000, status: "successful" } }
    
    if (event.event === 'payout.successful' || event.event === 'payout.failed') {
      const reference = event.data?.reference
      if (!reference) return new Response('OK', { status: 200 })

      // Sabi uses the internal withdrawal ID as the reference (or a mapping)
      // For this example, let's assume the reference is the withdrawal ID
      // or we extract the ID from "payout_{id}"
      const withdrawalId = reference.replace('payout_', '')

      const wRows = await db.select().from(withdrawals).where(eq(withdrawals.id, withdrawalId)).limit(1)
      const withdrawal = wRows[0]
      
      if (!withdrawal) {
        console.warn(`[Bachs Webhook] Withdrawal record not found for reference: ${reference}`)
        return new Response('OK', { status: 200 })
      }

      // If it's already processed, ignore
      if (withdrawal.status === 'COMPLETED' || withdrawal.status === 'FAILED') {
        return new Response('OK', { status: 200 })
      }

      if (event.event === 'payout.successful') {
        // Mark as completed
        await db.update(withdrawals)
          .set({ status: 'COMPLETED' })
          .where(eq(withdrawals.id, withdrawal.id))
          
        console.log(`[Bachs Webhook] Payout COMPLETED for withdrawal ${withdrawal.id}`)
      } 
      else if (event.event === 'payout.failed') {
        // Mark as failed and refund the user's wallet
        await db.update(withdrawals)
          .set({ status: 'FAILED' })
          .where(eq(withdrawals.id, withdrawal.id))
          
        const userRows = await db.select().from(users).where(eq(users.id, withdrawal.userId)).limit(1)
        if (userRows[0]) {
          await db.update(users)
            .set({ withdrawableBalance: userRows[0].withdrawableBalance + withdrawal.amount })
            .where(eq(users.id, userRows[0].id))
          
          console.log(`[Bachs Webhook] Payout FAILED. Refunded ₦${withdrawal.amount} to user ${userRows[0].email}`)
        }
      }
    }

    // Handle Ad Purchases (Collections) via Bachs
    if (event.event === 'payment.successful' || event.event === 'collection.successful') {
      const data = event.data
      const amountNaira = data.amount // Assume Bachs sends in exact Naira
      const metadata = data.metadata || {}

      console.log(`[Bachs Webhook] Payment received: ₦${amountNaira}`)

      if (metadata.type === 'AD_PURCHASE' && metadata.slotName) {
        console.log(`[Bachs Webhook] Activating Ad Slot: ${metadata.slotName}`)
        
        const potContribution = Math.floor(amountNaira * 0.4)
        
        if (potContribution > 0) {
          const nextWeek = getNextIsoWeek()
          const existingPot = await db.select().from(weeklyPots).where(eq(weeklyPots.matchWeekId, nextWeek)).limit(1)
          
          if (existingPot[0]) {
            await db.update(weeklyPots)
              .set({ potSize: existingPot[0].potSize + potContribution })
              .where(eq(weeklyPots.id, existingPot[0].id))
          } else {
            await db.insert(weeklyPots).values({ 
              matchWeekId: nextWeek, 
              potSize: potContribution 
            })
          }
          console.log(`[Bachs Webhook] Funded next week's pot with ₦${potContribution}`)
        }
      }
    }

    // Always return a 200 OK
    return new Response('OK', { status: 200 })
  }
})
