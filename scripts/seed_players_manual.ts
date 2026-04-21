/**
 * Seeds 2026 NFL Draft top prospects into Supabase.
 * Source: drafttek.com big board (updated April 17, 2026)
 * Run: npx tsx scripts/seed_players_manual.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Source: drafttek.com April 17 2026 | buzz_grade estimated from consensus rank
const PLAYERS = [
  { name: 'Fernando Mendoza',      position: 'QB',   school: 'Indiana',          buzz_grade: 95.5, consensus_rank: 1  },
  { name: 'Arvell Reese',          position: 'EDGE', school: 'Ohio State',        buzz_grade: 93.8, consensus_rank: 2  },
  { name: 'Jeremiyah Love',        position: 'RB',   school: 'Notre Dame',        buzz_grade: 92.1, consensus_rank: 3  },
  { name: 'Sonny Styles',          position: 'LB',   school: 'Ohio State',        buzz_grade: 91.4, consensus_rank: 4  },
  { name: 'Caleb Downs',           position: 'S',    school: 'Ohio State',        buzz_grade: 91.0, consensus_rank: 5  },
  { name: 'Francis Mauigoa',       position: 'OT',   school: 'Miami (FL)',        buzz_grade: 90.5, consensus_rank: 6  },
  { name: 'David Bailey',          position: 'EDGE', school: 'Texas Tech',        buzz_grade: 90.2, consensus_rank: 7  },
  { name: 'Mansoor Delane',        position: 'CB',   school: 'LSU',               buzz_grade: 89.8, consensus_rank: 8  },
  { name: 'Carnell Tate',          position: 'WR',   school: 'Ohio State',        buzz_grade: 89.5, consensus_rank: 9  },
  { name: 'Spencer Fano',          position: 'OT',   school: 'Utah',              buzz_grade: 89.2, consensus_rank: 10 },
  { name: 'Makai Lemon',           position: 'WR',   school: 'USC',               buzz_grade: 88.9, consensus_rank: 11 },
  { name: 'Rueben Bain Jr.',       position: 'EDGE', school: 'Miami (FL)',        buzz_grade: 88.6, consensus_rank: 12 },
  { name: 'Olaivavega Ioane',      position: 'IOL',  school: 'Penn State',        buzz_grade: 88.3, consensus_rank: 13 },
  { name: 'Kenyon Sadiq',          position: 'TE',   school: 'Oregon',            buzz_grade: 88.0, consensus_rank: 14 },
  { name: 'Jordyn Tyson',          position: 'WR',   school: 'Arizona State',     buzz_grade: 87.7, consensus_rank: 15 },
  { name: 'Keldric Faulk',         position: 'EDGE', school: 'Auburn',            buzz_grade: 87.4, consensus_rank: 16 },
  { name: 'Monroe Freeling',       position: 'OT',   school: 'Georgia',           buzz_grade: 87.1, consensus_rank: 17 },
  { name: 'Dillon Thieneman',      position: 'S',    school: 'Oregon',            buzz_grade: 86.8, consensus_rank: 18 },
  { name: 'Jermod McCoy',          position: 'CB',   school: 'Tennessee',         buzz_grade: 86.5, consensus_rank: 19 },
  { name: 'Ty Simpson',            position: 'QB',   school: 'Alabama',           buzz_grade: 86.2, consensus_rank: 20 },
  { name: 'Omar Cooper Jr.',       position: 'WR',   school: 'Indiana',           buzz_grade: 85.9, consensus_rank: 21 },
  { name: 'Chris Johnson',         position: 'CB',   school: 'San Diego State',   buzz_grade: 85.6, consensus_rank: 22 },
  { name: 'T.J. Parker',           position: 'EDGE', school: 'Clemson',           buzz_grade: 85.3, consensus_rank: 23 },
  { name: 'Kadyn Proctor',         position: 'OT',   school: 'Alabama',           buzz_grade: 85.0, consensus_rank: 24 },
  { name: 'Colton Hood',           position: 'CB',   school: 'Tennessee',         buzz_grade: 84.7, consensus_rank: 25 },
  { name: 'Peter Woods',           position: 'DT',   school: 'Clemson',           buzz_grade: 84.4, consensus_rank: 26 },
  { name: 'KC Concepcion',         position: 'WR',   school: 'Texas A&M',         buzz_grade: 84.1, consensus_rank: 27 },
  { name: 'Caleb Lomu',            position: 'OT',   school: 'Utah',              buzz_grade: 83.8, consensus_rank: 28 },
  { name: 'Emmanuel McNeil-Warren',position: 'S',    school: 'Toledo',            buzz_grade: 83.5, consensus_rank: 29 },
  { name: 'Denzel Boston',         position: 'WR',   school: 'Washington',        buzz_grade: 83.2, consensus_rank: 30 },
  { name: 'Blake Miller',          position: 'OT',   school: 'Clemson',           buzz_grade: 82.9, consensus_rank: 31 },
  { name: 'Max Iheanachor',        position: 'OT',   school: 'Arizona State',     buzz_grade: 82.6, consensus_rank: 32 },
  { name: 'Kayden McDonald',       position: 'DT',   school: 'Ohio State',        buzz_grade: 82.3, consensus_rank: 33 },
  { name: 'Akheem Mesidor',        position: 'EDGE', school: 'Miami (FL)',        buzz_grade: 82.0, consensus_rank: 34 },
  { name: 'Lee Hunter',            position: 'DT',   school: 'Texas Tech',        buzz_grade: 81.7, consensus_rank: 35 },
  { name: 'Brandon Cisse',         position: 'CB',   school: 'South Carolina',    buzz_grade: 81.4, consensus_rank: 36 },
  { name: 'Cashius Howell',        position: 'EDGE', school: 'Texas A&M',         buzz_grade: 81.1, consensus_rank: 37 },
  { name: 'C.J. Allen',            position: 'LB',   school: 'Georgia',           buzz_grade: 80.8, consensus_rank: 38 },
  { name: 'Christen Miller',       position: 'DT',   school: 'Georgia',           buzz_grade: 80.5, consensus_rank: 39 },
  { name: 'Malachi Lawrence',      position: 'EDGE', school: 'UCF',               buzz_grade: 80.2, consensus_rank: 40 },
  { name: 'Gabe Jacas',            position: 'EDGE', school: 'Illinois',          buzz_grade: 79.9, consensus_rank: 41 },
  { name: 'Eli Stowers',           position: 'TE',   school: 'Vanderbilt',        buzz_grade: 79.6, consensus_rank: 42 },
  { name: 'Anthony Hill Jr.',      position: 'LB',   school: 'Texas',             buzz_grade: 79.3, consensus_rank: 43 },
  { name: 'Emmanuel Pregnon',      position: 'IOL',  school: 'Oregon',            buzz_grade: 79.0, consensus_rank: 44 },
  { name: 'D\'Angelo Ponds',       position: 'CB',   school: 'Indiana',           buzz_grade: 78.7, consensus_rank: 45 },
  { name: 'R Mason Thomas',        position: 'EDGE', school: 'Oklahoma',          buzz_grade: 78.4, consensus_rank: 46 },
  { name: 'Keionte Scott',         position: 'CB',   school: 'Miami (FL)',        buzz_grade: 78.1, consensus_rank: 47 },
  { name: 'Chase Bisontis',        position: 'IOL',  school: 'Texas A&M',         buzz_grade: 77.8, consensus_rank: 48 },
  { name: 'Avieon Terrell',        position: 'CB',   school: 'Clemson',           buzz_grade: 77.5, consensus_rank: 49 },
  { name: 'Caleb Banks',           position: 'DT',   school: 'Florida',           buzz_grade: 77.2, consensus_rank: 50 },
];

async function main() {
  // Clear old (2025) player data first
  await supabase.from('players').delete().neq('id', 0);

  const players = PLAYERS.map(p => ({ ...p, taken: false }));
  const { error } = await supabase.from('players').upsert(players, { onConflict: 'name' });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`✅ Seeded ${players.length} 2026 draft prospects.`);
  }
}

main().catch(console.error);
