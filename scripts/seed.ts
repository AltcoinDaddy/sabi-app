import { db } from '../src/db/index.js';
import { matches, users, picks, ads } from '../src/db/schema.js';
import { sql } from 'drizzle-orm';

function getCurrentIsoWeek() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo}`
}


async function main() {
  console.log('Seeding Database...');

  // Clear existing seed data (optional, but good for idempotency)
  await db.execute(sql`TRUNCATE TABLE matches, users, leaderboard_snapshots, ads, picks, otps RESTART IDENTITY CASCADE`);

  console.log('Seeding Matches...');
  // 3-4 upcoming EPL matches
  await db.insert(matches).values([
    {
      homeTeam: 'Arsenal',
      awayTeam: 'Man City',
      kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
      status: 'pending'
    },
    {
      homeTeam: 'Chelsea',
      awayTeam: 'Liverpool',
      kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
      status: 'pending'
    },
    {
      homeTeam: 'Man Utd',
      awayTeam: 'Spurs',
      kickoffTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), // 4 days from now
    },
    {
      homeTeam: 'Resolved Team A',
      awayTeam: 'Resolved Team B',
      kickoffTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      status: 'completed',
      actualResult: 'home'
    }
  ]).returning();

  console.log('Seeding Users & Leaderboard...');
  // 15 dummy users
  const dummyUsers = Array.from({ length: 15 }).map((_, i) => ({
    email: `player${i + 1}_${Math.floor(1000 + Math.random() * 9000)}@example.com`,
  }));
  
  const createdUsers = await db.insert(users).values(dummyUsers).returning();

  const pickEntries = createdUsers.map((u) => {
    const points = Math.floor(Math.random() * 15) * 10;
    return {
      userId: u.id,
      matchId: 4, // The resolved match is the 4th inserted
      predictedResult: 'home',
      status: 'resolved',
      pointsAwarded: points,
      matchWeekId: getCurrentIsoWeek(),
      seasonId: new Date().getUTCFullYear().toString()
    }
  });

  await db.insert(picks).values(pickEntries);

  console.log('Seeding Ads...');
  // Hardcode 2-3 ads as requested by PRD
  await db.insert(ads).values([
    {
      slotName: 'fixture_banner',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
      link: 'https://paystack.com',
      text: 'Send money instantly with Paystack.',
      active: true,
    },
    {
      slotName: 'leaderboard_takeover',
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
      link: 'https://piggyvest.com',
      text: 'Save and Invest with PiggyVest.',
      active: true,
    }
  ]);

  console.log('Seed Complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
