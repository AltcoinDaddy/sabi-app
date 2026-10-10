import { pgTable, serial, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  role: text('role').default('user').notNull(),
  
  // Wallet / Ledger
  withdrawableBalance: integer('withdrawable_balance').default(0).notNull(),
  lifetimeEarned: integer('lifetime_earned').default(0).notNull(),
});

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  method: text('method').notNull(), // 'BANK', 'MOMO', 'AIRTIME', 'CRYPTO'
  destination: text('destination').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const weeklyPots = pgTable('weekly_pots', {
  id: serial('id').primaryKey(),
  matchWeekId: text('match_week_id').notNull().unique(), // e.g. '2026-W41'
  potSize: integer('pot_size').default(0).notNull(), // Amount in Naira
  status: text('status').default('OPEN').notNull(), // 'OPEN', 'DISTRIBUTED'
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  kickoffTime: timestamp('kickoff_time').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'completed'
  actualResult: text('actual_result'), // 'home', 'away', 'draw'
  matchWeekId: text('match_week_id'),
  seasonId: text('season_id'),
  underdogTeam: text('underdog_team'), // e.g. 'home' or 'away'
});

export const picks = pgTable('picks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  matchId: integer('match_id').references(() => matches.id).notNull(),
  predictedResult: text('predicted_result').notNull(), // 'home', 'away', 'draw'
  status: text('status').default('pending').notNull(), // 'pending', 'won', 'lost'
  pointsAwarded: integer('points_awarded'),
  matchWeekId: text('match_week_id'),
  seasonId: text('season_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaderboardSnapshots = pgTable('leaderboard_snapshots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').default(0).notNull(),
  rank: integer('rank'),
  type: text('type').notNull(), // 'WEEKLY', 'SEASON'
  periodId: text('period_id').notNull(), // '2026-W41', '2026'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ads = pgTable('ads', {
  id: serial('id').primaryKey(),
  slotName: text('slot_name').notNull(),
  imageUrl: text('image_url').notNull(),
  link: text('link').notNull(),
  text: text('text').notNull(),
  active: boolean('active').default(true).notNull(),
});

export const otps = pgTable('otps', {
  email: text('email').primaryKey(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});
