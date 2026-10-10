import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: text('phone_number').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  role: text('role').default('user').notNull(),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  kickoffTime: timestamp('kickoff_time').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'completed'
  actualResult: text('actual_result'), // 'home', 'away', 'draw'
});

export const picks = pgTable('picks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  matchId: integer('match_id').references(() => matches.id).notNull(),
  predictedResult: text('predicted_result').notNull(), // 'home', 'away', 'draw'
  status: text('status').default('pending').notNull(), // 'pending', 'won', 'lost'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  points: integer('points').default(0).notNull(),
  rank: integer('rank'),
});

export const ads = pgTable('ads', {
  id: serial('id').primaryKey(),
  slotName: text('slot_name').notNull(),
  imageUrl: text('image_url').notNull(),
  link: text('link').notNull(),
  text: text('text').notNull(),
  active: boolean('active').default(true).notNull(),
});
