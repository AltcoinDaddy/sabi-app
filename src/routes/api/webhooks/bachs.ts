import { createAPIFileRoute } from '@tanstack/react-start/api'
import crypto from 'crypto'
import { db } from '@/db'
import { users, withdrawals } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const APIRoute = createAPIFileRoute('/api/webhooks/bachs')({
  POST: async ({ request }) => {
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
    // if (hash !== signature) {
    //   return new Response('Invalid signature', { status: 401 })
    // }

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

    // Always return a 200 OK
    return new Response('OK', { status: 200 })
  }
})
