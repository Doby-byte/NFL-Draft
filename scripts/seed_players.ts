/**
 * Merges big_board.json + consensus_board.json and seeds Supabase players table.
 * Run after scraping: npx ts-node scripts/seed_players.ts
 */

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const bigBoard     = JSON.parse(fs.readFileSync('scripts/big_board.json', 'utf8'));
  const consensusBoard = JSON.parse(fs.readFileSync('scripts/consensus_board.json', 'utf8'));

  const consensusMap = new Map(
    consensusBoard.map((p: { name: string; consensus_rank: number }) => [
      p.name.toLowerCase(), p.consensus_rank
    ])
  );

  const players = bigBoard.map((p: { name: string; position: string; school: string; buzz_grade: number }, i: number) => ({
    name:           p.name,
    position:       p.position,
    school:         p.school,
    buzz_grade:     p.buzz_grade,
    consensus_rank: (consensusMap.get(p.name.toLowerCase()) as number) ?? (i + 1),
    taken:          false,
  }));

  console.log(`Seeding ${players.length} players to Supabase...`);

  // Upsert in batches of 50
  for (let i = 0; i < players.length; i += 50) {
    const batch = players.slice(i, i + 50);
    const { error } = await supabase
      .from('players')
      .upsert(batch, { onConflict: 'name' });
    if (error) {
      console.error(`Batch ${i}–${i + 50} error:`, error.message);
    } else {
      console.log(`Seeded players ${i + 1}–${Math.min(i + 50, players.length)}`);
    }
  }

  console.log('Done seeding players.');
}

main().catch(console.error);
