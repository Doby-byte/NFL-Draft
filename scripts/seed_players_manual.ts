/**
 * Seeds the 2026 NFL Draft top prospects directly into Supabase.
 * Used as fallback when scraping is blocked.
 * Run: npx tsx scripts/seed_players_manual.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PLAYERS = [
  { name: 'Cam Ward',            position: 'QB',   school: 'Miami',          buzz_grade: 94.2, consensus_rank: 1  },
  { name: 'Shedeur Sanders',     position: 'QB',   school: 'Colorado',       buzz_grade: 91.8, consensus_rank: 2  },
  { name: 'Travis Hunter',       position: 'CB',   school: 'Colorado',       buzz_grade: 93.5, consensus_rank: 3  },
  { name: 'Abdul Carter',        position: 'EDGE', school: 'Penn State',     buzz_grade: 92.1, consensus_rank: 4  },
  { name: 'Will Johnson',        position: 'CB',   school: 'Michigan',       buzz_grade: 91.3, consensus_rank: 5  },
  { name: 'Mason Graham',        position: 'DT',   school: 'Michigan',       buzz_grade: 90.8, consensus_rank: 6  },
  { name: 'Tetairoa McMillan',   position: 'WR',   school: 'Arizona',        buzz_grade: 90.2, consensus_rank: 7  },
  { name: 'Jalon Walker',        position: 'LB',   school: 'Georgia',        buzz_grade: 89.6, consensus_rank: 8  },
  { name: 'Ashton Jeanty',       position: 'RB',   school: 'Boise State',    buzz_grade: 91.0, consensus_rank: 9  },
  { name: 'Malaki Starks',       position: 'S',    school: 'Georgia',        buzz_grade: 88.9, consensus_rank: 10 },
  { name: 'Kelvin Banks Jr.',    position: 'OT',   school: 'Texas',          buzz_grade: 90.4, consensus_rank: 11 },
  { name: 'Luther Burden III',   position: 'WR',   school: 'Missouri',       buzz_grade: 88.1, consensus_rank: 12 },
  { name: 'Nick Emmanwori',      position: 'S',    school: 'South Carolina', buzz_grade: 87.5, consensus_rank: 13 },
  { name: 'Jihaad Campbell',     position: 'LB',   school: 'Alabama',        buzz_grade: 87.2, consensus_rank: 14 },
  { name: 'Mykel Williams',      position: 'EDGE', school: 'Georgia',        buzz_grade: 87.0, consensus_rank: 15 },
  { name: 'Derrick Harmon',      position: 'DT',   school: 'Oregon',         buzz_grade: 86.8, consensus_rank: 16 },
  { name: 'Grey Zabel',          position: 'IOL',  school: 'North Dakota St',buzz_grade: 86.5, consensus_rank: 17 },
  { name: 'Tyler Warren',        position: 'TE',   school: 'Penn State',     buzz_grade: 86.3, consensus_rank: 18 },
  { name: 'Colston Loveland',    position: 'TE',   school: 'Michigan',       buzz_grade: 85.9, consensus_rank: 19 },
  { name: 'Azareye\'h Thomas',   position: 'CB',   school: 'Florida State',  buzz_grade: 85.4, consensus_rank: 20 },
  { name: 'Nic Scourton',        position: 'EDGE', school: 'Texas A&M',      buzz_grade: 85.1, consensus_rank: 21 },
  { name: 'James Pearce Jr.',    position: 'EDGE', school: 'Tennessee',      buzz_grade: 84.8, consensus_rank: 22 },
  { name: 'Kenneth Grant',       position: 'DT',   school: 'Michigan',       buzz_grade: 84.6, consensus_rank: 23 },
  { name: 'Shemar Stewart',      position: 'DT',   school: 'Texas A&M',      buzz_grade: 84.3, consensus_rank: 24 },
  { name: 'Josh Simmons',        position: 'OT',   school: 'Ohio State',     buzz_grade: 84.0, consensus_rank: 25 },
  { name: 'Armand Membou',       position: 'OT',   school: 'Missouri',       buzz_grade: 83.8, consensus_rank: 26 },
  { name: 'Maxwell Hairston',    position: 'CB',   school: 'Kentucky',       buzz_grade: 83.5, consensus_rank: 27 },
  { name: 'Darius Alexander',    position: 'DT',   school: 'Toledo',         buzz_grade: 83.2, consensus_rank: 28 },
  { name: 'Donovan Ezeiruaku',   position: 'EDGE', school: 'Boston College', buzz_grade: 83.0, consensus_rank: 29 },
  { name: 'TreVeyon Henderson',  position: 'RB',   school: 'Ohio State',     buzz_grade: 82.7, consensus_rank: 30 },
  { name: 'Omarion Hampton',     position: 'RB',   school: 'North Carolina', buzz_grade: 82.5, consensus_rank: 31 },
  { name: 'Jack Sawyer',         position: 'EDGE', school: 'Ohio State',     buzz_grade: 82.3, consensus_rank: 32 },
  { name: 'Jaxson Dart',         position: 'QB',   school: 'Ole Miss',       buzz_grade: 81.8, consensus_rank: 33 },
  { name: 'Tyler Shough',        position: 'QB',   school: 'Louisville',     buzz_grade: 80.5, consensus_rank: 34 },
  { name: 'Landon Jackson',      position: 'EDGE', school: 'Arkansas',       buzz_grade: 81.0, consensus_rank: 35 },
  { name: 'Mike Green',          position: 'EDGE', school: 'Marshall',       buzz_grade: 80.8, consensus_rank: 36 },
  { name: 'Emeka Egbuka',        position: 'WR',   school: 'Ohio State',     buzz_grade: 80.5, consensus_rank: 37 },
  { name: 'Jaylen Mbakwe',       position: 'CB',   school: 'Pittsburgh',     buzz_grade: 80.2, consensus_rank: 38 },
  { name: 'Jonah Savaiinaea',    position: 'IOL',  school: 'Arizona',        buzz_grade: 80.0, consensus_rank: 39 },
  { name: 'Cameron Williams',    position: 'OT',   school: 'Texas',          buzz_grade: 79.8, consensus_rank: 40 },
];

async function main() {
  const players = PLAYERS.map(p => ({ ...p, taken: false }));

  console.log(`Seeding ${players.length} players...`);
  const { error } = await supabase.from('players').upsert(players, { onConflict: 'name' });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`✅ Seeded ${players.length} players successfully.`);
  }
}

main().catch(console.error);
