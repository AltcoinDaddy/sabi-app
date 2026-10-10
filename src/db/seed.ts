import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sabi';
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log('Seeding Database...');

  // 1. Clear existing data
  await db.delete(schema.picks);
  await db.delete(schema.leaderboardEntries);
  await db.delete(schema.ads);
  await db.delete(schema.matches);
  await db.delete(schema.users);

  // 2. Insert Users
  const userValues = Array.from({ length: 20 }).map((_, i) => ({
    email: `player${i + 1}_${Math.floor(1000 + Math.random() * 9000)}@example.com`,
    role: i === 0 ? 'admin' : 'user', // first user is admin for demo
  }));
  const insertedUsers = await db.insert(schema.users).values(userValues).returning();
  console.log(`Inserted ${insertedUsers.length} users.`);

  // 3. Insert Matches (EPL)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0); // 3:00 PM tomorrow

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(17, 30, 0, 0);

  const matchValues = [
    {
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      kickoffTime: tomorrow,
      status: 'pending',
    },
    {
      homeTeam: 'Man City',
      awayTeam: 'Liverpool',
      kickoffTime: tomorrow,
      status: 'pending',
    },
    {
      homeTeam: 'Man United',
      awayTeam: 'Tottenham',
      kickoffTime: nextWeek,
      status: 'pending',
    },
    {
      homeTeam: 'Aston Villa',
      awayTeam: 'Newcastle',
      kickoffTime: nextWeek,
      status: 'pending',
    }
  ];
  const insertedMatches = await db.insert(schema.matches).values(matchValues).returning();
  console.log(`Inserted ${insertedMatches.length} matches.`);

  // 4. Insert Leaderboard (Mock Points)
  // Sort users by random points for the week
  const sortedUsers = [...insertedUsers].map((u) => ({
    userId: u.id,
    points: Math.floor(Math.random() * 150),
  })).sort((a, b) => b.points - a.points);

  const leaderboardValues = sortedUsers.map((u, i) => ({
    userId: u.userId,
    points: u.points,
    rank: i + 1,
  }));
  await db.insert(schema.leaderboardEntries).values(leaderboardValues);
  console.log('Inserted leaderboard entries.');

  // 5. Insert Ads
  const adValues = [
    {
      slotName: 'fixture_banner',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80', // generic business
      link: 'https://example.com/fintech',
      text: 'MockPay - Fast Transfers, Zero Fees',
      active: true,
    },
    {
      slotName: 'leaderboard_takeover',
      imageUrl: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=800&q=80', // beverage
      link: 'https://example.com/drink',
      text: 'Thirst Quencher Energy - Power Your Play',
      active: true,
    }
  ];
  await db.insert(schema.ads).values(adValues);
  console.log('Inserted ads.');

  console.log('Database Seeding Complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed Error:', err);
  process.exit(1);
});
