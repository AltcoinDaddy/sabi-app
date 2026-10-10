import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';
async function main() {
  await db.execute(sql`DROP TABLE IF EXISTS otps, users, leaderboard_entries, leaderboard_snapshots, picks, withdrawals, weekly_pots, ads, matches CASCADE`);
  console.log('Tables dropped');
  process.exit(0);
}
main();
