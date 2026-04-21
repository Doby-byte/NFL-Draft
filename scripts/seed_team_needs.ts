/**
 * Uses Claude to generate team needs for all 32 NFL teams and writes to public/team_needs.json.
 * One-time call at startup — costs ~$0.10 total.
 * Run: npx ts-node scripts/seed_team_needs.ts
 */

import * as fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const NFL_TEAMS = [
  'TEN','CLE','NYG','NE','JAX','LV','NYJ','CAR','NO','CHI',
  'SF','DAL','MIA','IND','ATL','ARI','CIN','SEA','TB','DEN',
  'PIT','LAC','GB','MIN','HOU','LAR','BAL','DET','WAS','BUF',
  'KC','PHI',
];

const VALID_POSITIONS = ['QB','OT','EDGE','CB','WR','DT','TE','LB','S','IOL','RB'];

async function main() {
  console.log('Seeding team needs via Claude haiku...');

  const prompt = `You are an NFL analyst. For each of the 32 NFL teams heading into the 2026 NFL Draft, list their top 5 positional needs in priority order.

Return ONLY valid JSON in this exact format, no markdown:
{
  "TEN": [
    {"position": "QB", "rank": 1},
    {"position": "EDGE", "rank": 2},
    {"position": "CB", "rank": 3},
    {"position": "OT", "rank": 4},
    {"position": "WR", "rank": 5}
  ],
  ... (all 32 teams)
}

Teams: ${NFL_TEAMS.join(', ')}
Valid positions: ${VALID_POSITIONS.join(', ')}

Use your knowledge of each team's current roster needs, cap situation, and recent performance. Be specific and accurate.`;

  const response = await client.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const teamNeeds = JSON.parse(cleaned);

  fs.writeFileSync('public/team_needs.json', JSON.stringify(teamNeeds, null, 2));
  console.log('Saved public/team_needs.json');
  console.log(`Input tokens: ${response.usage.input_tokens} | Output: ${response.usage.output_tokens}`);
}

main().catch(console.error);
