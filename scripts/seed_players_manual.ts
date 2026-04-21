/**
 * Seeds 2026 NFL Draft top 150 prospects into Supabase.
 * Source: drafttek.com big board (updated April 17, 2026), ranks 1-150
 * Run: npx tsx scripts/seed_players_manual.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Normalize positions to COMPASS-compatible keys
function pos(p: string): string {
  const map: Record<string, string> = {
    OLB: 'LB', ILB: 'LB', DL1T: 'DT', DL3T: 'DT', DL5T: 'DT',
    CBN: 'CB', WRS: 'WR', OG: 'IOL', OC: 'IOL',
  };
  return map[p] ?? p;
}

const RAW_PLAYERS: [string, string, string][] = [
  // [name, position, school]  — ranks 1-150 from drafttek.com April 17 2026
  ['Fernando Mendoza',       'QB',   'Indiana'],
  ['Arvell Reese',           'EDGE', 'Ohio State'],
  ['Jeremiyah Love',         'RB',   'Notre Dame'],
  ['Sonny Styles',           'OLB',  'Ohio State'],
  ['Caleb Downs',            'S',    'Ohio State'],
  ['Francis Mauigoa',        'OT',   'Miami (FL)'],
  ['David Bailey',           'EDGE', 'Texas Tech'],
  ['Mansoor Delane',         'CB',   'LSU'],
  ['Carnell Tate',           'WR',   'Ohio State'],
  ['Spencer Fano',           'OT',   'Utah'],
  ['Makai Lemon',            'WR',   'USC'],
  ['Rueben Bain Jr.',        'EDGE', 'Miami (FL)'],
  ['Olaivavega Ioane',       'OG',   'Penn State'],
  ['Kenyon Sadiq',           'TE',   'Oregon'],
  ['Jordyn Tyson',           'WR',   'Arizona State'],
  ['Keldric Faulk',          'EDGE', 'Auburn'],
  ['Monroe Freeling',        'OT',   'Georgia'],
  ['Dillon Thieneman',       'S',    'Oregon'],
  ['Jermod McCoy',           'CB',   'Tennessee'],
  ['Ty Simpson',             'QB',   'Alabama'],
  ['Omar Cooper Jr.',        'WR',   'Indiana'],
  ['Chris Johnson',          'CB',   'San Diego State'],
  ['T.J. Parker',            'EDGE', 'Clemson'],
  ['Kadyn Proctor',          'OT',   'Alabama'],
  ['Colton Hood',            'CB',   'Tennessee'],
  ['Peter Woods',            'DT',   'Clemson'],
  ['KC Concepcion',          'WR',   'Texas A&M'],
  ['Caleb Lomu',             'OT',   'Utah'],
  ['Emmanuel McNeil-Warren', 'S',    'Toledo'],
  ['Denzel Boston',          'WR',   'Washington'],
  ['Blake Miller',           'OT',   'Clemson'],
  ['Max Iheanachor',         'OT',   'Arizona State'],
  ['Kayden McDonald',        'DT',   'Ohio State'],
  ['Akheem Mesidor',         'EDGE', 'Miami (FL)'],
  ['Lee Hunter',             'DT',   'Texas Tech'],
  ['Brandon Cisse',          'CB',   'South Carolina'],
  ['Cashius Howell',         'EDGE', 'Texas A&M'],
  ['C.J. Allen',             'OLB',  'Georgia'],
  ['Christen Miller',        'DT',   'Georgia'],
  ['Malachi Lawrence',       'EDGE', 'UCF'],
  ['Gabe Jacas',             'EDGE', 'Illinois'],
  ['Eli Stowers',            'TE',   'Vanderbilt'],
  ['Anthony Hill Jr.',       'ILB',  'Texas'],
  ['Emmanuel Pregnon',       'OG',   'Oregon'],
  ["D'Angelo Ponds",         'CBN',  'Indiana'],
  ['R Mason Thomas',         'EDGE', 'Oklahoma'],
  ['Keionte Scott',          'CB',   'Miami (FL)'],
  ['Chase Bisontis',         'OG',   'Texas A&M'],
  ['Avieon Terrell',         'CBN',  'Clemson'],
  ['Caleb Banks',            'DT',   'Florida'],
  ['Jadarian Price',         'RB',   'Notre Dame'],
  ['Germie Bernard',         'WR',   'Alabama'],
  ['Zion Young',             'EDGE', 'Missouri'],
  ['Jacob Rodriguez',        'ILB',  'Texas Tech'],
  ['Treydan Stukes',         'S',    'Arizona'],
  ['Jake Golday',            'OLB',  'Cincinnati'],
  ['Max Klare',              'TE',   'Ohio State'],
  ['Derrick Moore',          'EDGE', 'Michigan'],
  ['Chris Bell',             'WR',   'Louisville'],
  ['Mike Washington Jr.',    'RB',   'Arkansas'],
  ['Chris Brazzell II',      'WR',   'Tennessee'],
  ['Gennings Dunker',        'OG',   'Iowa'],
  ['Domonique Orange',       'DT',   'Iowa State'],
  ['Davison Igbinosun',      'CB',   'Ohio State'],
  ['Caleb Tiernan',          'OT',   'Northwestern'],
  ['A.J. Haulcy',            'S',    'LSU'],
  ['Ted Hurst',              'WR',   'Georgia State'],
  ['Romello Height',         'EDGE', 'Texas Tech'],
  ['Elijah Sarratt',         'WR',   'Indiana'],
  ['Keylan Rutledge',        'OG',   'Georgia Tech'],
  ['Antonio Williams',       'WR',   'Clemson'],
  ['Josiah Trotter',         'ILB',  'Missouri'],
  ['Zachariah Branch',       'WR',   'Georgia'],
  ['Malachi Fields',         'WR',   'Notre Dame'],
  ['Tacario Davis',          'CB',   'Washington'],
  ['Darrell Jackson Jr.',    'DT',   'Florida State'],
  ['Malik Muhammad',         'CB',   'Texas'],
  ['Dani Dennis-Sutton',     'EDGE', 'Penn State'],
  ['Kyle Louis',             'OLB',  'Pittsburgh'],
  ['Zakee Wheatley',         'S',    'Penn State'],
  ['Keith Abney II',         'CBN',  'Arizona State'],
  ['Gracen Halton',          'DT',   'Oklahoma'],
  ['Sam Hecht',              'OG',   'Kansas State'],
  ['Garrett Nussmeier',      'QB',   'LSU'],
  ['Connor Lew',             'OG',   'Auburn'],
  ['Zane Durant',            'DT',   'Penn State'],
  ['Jalen Farmer',           'OG',   'Kentucky'],
  ['Drew Allar',             'QB',   'Penn State'],
  ['Jake Slaughter',         'OG',   'Florida'],
  ['Bryce Lance',            'WR',   'North Dakota State'],
  ['Bud Clark',              'S',    'TCU'],
  ['Keyron Crawford',        'EDGE', 'Auburn'],
  ['Deion Burks',            'WR',   'Oklahoma'],
  ['V.J. Payne',             'S',    'Kansas State'],
  ['Genesis Smith',          'S',    'Arizona State'],
  ['Joshua Josephs',         'EDGE', 'Tennessee'],
  ['Logan Jones',            'OG',   'Iowa'],
  ['Jaishawn Barham',        'EDGE', 'Michigan'],
  ['Daylen Everette',        'CB',   'Georgia'],
  ['Skyler Bell',            'WR',   'Connecticut'],
  ['Sam Roush',              'TE',   'Stanford'],
  ['Chandler Rivers',        'CBN',  'Duke'],
  ['Kamari Ramsey',          'S',    'USC'],
  ['Jonah Coleman',          'RB',   'Washington'],
  ['Rayshaun Benny',         'DT',   'Michigan'],
  ['Emmett Johnson',         'RB',   'Nebraska'],
  ['Will Lee III',           'CB',   'Texas A&M'],
  ['De\'Zhaun Stribling',    'WR',   'Ole Miss'],
  ['Justin Joly',            'TE',   'NC State'],
  ['Keyshaun Elliott',       'ILB',  'Arizona State'],
  ['Markel Bell',            'OT',   'Miami (FL)'],
  ['Carson Beck',            'QB',   'Miami (FL)'],
  ['Kage Casey',             'OG',   'Boise State'],
  ['Taylen Green',           'QB',   'Arkansas'],
  ['Tyler Onyedim',          'DT',   'Texas A&M'],
  ['Julian Neal',            'CB',   'Arkansas'],
  ['Billy Schrauth',         'OG',   'Notre Dame'],
  ['Austin Barber',          'OT',   'Florida'],
  ['Dametrious Crownover',   'OT',   'Texas A&M'],
  ['Chris McClellan',        'DT',   'Missouri'],
  ['Kaytron Allen',          'RB',   'Penn State'],
  ['Jalon Kilgore',          'S',    'South Carolina'],
  ['Ja\'Kobi Lane',          'WR',   'USC'],
  ['Travis Burke',           'OT',   'Memphis'],
  ['Brian Parker II',        'OG',   'Duke'],
  ['Brenen Thompson',        'WR',   'Mississippi State'],
  ['L.T. Overton',           'DT',   'Alabama'],
  ['Albert Regis',           'DT',   'Texas A&M'],
  ['Michael Taaffe',         'S',    'Texas'],
  ['Oscar Delp',             'TE',   'Georgia'],
  ['Devin Moore',            'CB',   'Florida'],
  ['Tim Keenan III',         'DT',   'Alabama'],
  ['Bryce Boettcher',        'ILB',  'Oregon'],
  ['Jude Bowry',             'OT',   'Boston College'],
  ['Max Llewellyn',          'EDGE', 'Iowa'],
  ['Trey Zuhn III',          'OG',   'Texas A&M'],
  ['Nick Singleton',         'RB',   'Penn State'],
  ['Demond Claiborne',       'RB',   'Wake Forest'],
  ['Nick Barrett',           'DT',   'South Carolina'],
  ['Cole Payton',            'QB',   'North Dakota State'],
  ['Jalen Huskey',           'S',    'Maryland'],
  ['Isaiah World',           'OT',   'Oregon'],
  ['Kaleb Elarms-Orr',       'OLB',  'TCU'],
  ['Nadame Tucker',          'EDGE', 'Western Michigan'],
  ['Michael Trigg',          'TE',   'Baylor'],
  ['Charles Demmings',       'CB',   'Stephen F Austin'],
  ['J.C. Davis',             'OT',   'Illinois'],
  ['Jadon Canady',           'CBN',  'Oregon'],
  ['DeShon Singleton',       'S',    'Nebraska'],
  ['Harold Perkins Jr.',     'OLB',  'LSU'],
];

async function main() {
  await supabase.from('players').delete().neq('id', 0);

  const players = RAW_PLAYERS.map(([name, position, school], i) => ({
    name,
    position: pos(position),
    school,
    buzz_grade: parseFloat((95.5 - i * 0.31).toFixed(1)),
    consensus_rank: i + 1,
    taken: false,
  }));

  const { error } = await supabase.from('players').upsert(players, { onConflict: 'name' });
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`✅ Seeded ${players.length} 2026 draft prospects (ranks 1-150).`);
  }
}

main().catch(console.error);
