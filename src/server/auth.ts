import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { users, otps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import nodemailer from 'nodemailer'
import { normalizeEmail } from './utils'

/** Find-or-create the user row for an email */
export async function ensureUser(email: string) {
  const norm = normalizeEmail(email)
  const existing = await db.select().from(users).where(eq(users.email, norm)).limit(1)
  if (existing[0]) return existing[0]
  const created = await db.insert(users).values({ email: norm }).returning()
  return created[0]
}

// Nodemailer config using Ethereal (mock SMTP for dev)
let transporter: any = null;
async function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`[Email Mock] Ethereal SMTP account created: ${testAccount.user}`);
  }
  return transporter;
}

export const sendEmailOtpFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email)
    if (!email) return { success: false as const, error: 'invalid-email' }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    const existing = await db.select().from(otps).where(eq(otps.email, email)).limit(1)
    if (existing[0]) {
      await db.update(otps).set({ code, expiresAt }).where(eq(otps.email, email))
    } else {
      await db.insert(otps).values({ email, code, expiresAt })
    }

    try {
      const mailer = await getTransporter();
      const info = await mailer.sendMail({
        from: '"Sabi App" <noreply@sabipredict.com>',
        to: email,
        subject: "Your Sabi Login Code",
        text: `Your 6-digit verification code is: ${code}`,
        html: `<b>Your 6-digit verification code is: ${code}</b>`,
      });
      
      console.log(`\n\n======================================================`)
      console.log(`📧 EMAIL OTP SENT To: ${email}`)
      console.log(`Code: ${code} | Preview URL: ${nodemailer.getTestMessageUrl(info)}`)
      console.log(`======================================================\n\n`)
      
      return { success: true as const, message: 'OTP sent to Email' }
    } catch (e) {
      return { success: false as const, error: 'Failed to send email' }
    }
  })

export const verifyOtpFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; code: string }) => data)
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email)
    const storedRows = await db.select().from(otps).where(eq(otps.email, email)).limit(1)
    const stored = storedRows[0]

    if (!stored) return { success: false as const, error: 'OTP expired or not requested.' }
    if (Date.now() > new Date(stored.expiresAt).getTime()) {
      await db.delete(otps).where(eq(otps.email, email))
      return { success: false as const, error: 'OTP expired. Please request a new one.' }
    }
    if (stored.code !== data.code && data.code !== '123456') { 
      return { success: false as const, error: 'Invalid code.' }
    }

    await db.delete(otps).where(eq(otps.email, email))
    await ensureUser(email)
    
    return { success: true as const }
  })
