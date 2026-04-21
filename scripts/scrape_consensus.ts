/**
 * Scrapes nflmockdraftdatabase.com for:
 *   1. Consensus big board rank (157 boards)
 *   2. Consensus mock draft picks by slot (1,217 mocks)
 * Run morning of draft: npx ts-node scripts/scrape_consensus.ts
 */

import * as fs from 'fs';
import * as https from 'https';

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim();

async function scrapeConsensusBoard(): Promise<Array<{ name: string; consensus_rank: number; position: string }>> {
  console.log('Fetching consensus big board from nflmockdraftdatabase.com...');
  const html = await fetchPage('https://www.nflmockdraftdatabase.com/big-boards/2026/consensus-big-board-2026');

  const players: Array<{ name: string; consensus_rank: number; position: string }> = [];
  const rowRegex  = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const tdRegex   = /<td[^>]*>([\s\S]*?)<\/td>/g;

  let rowMatch: RegExpExecArray | null;
  let rank = 1;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) {
      cells.push(stripTags(tdMatch[1]));
    }
    if (cells.length >= 3 && cells[0].match(/^\d+$/)) {
      players.push({
        name: cells[1].trim(),
        position: cells[2].trim(),
        consensus_rank: parseInt(cells[0]) || rank,
      });
      rank++;
    }
  }

  console.log(`Parsed ${players.length} players from consensus board`);
  return players;
}

async function scrapeConsensusMock(): Promise<Array<{ pick_number: number; consensus_player_name: string; consensus_rank: number }>> {
  console.log('Fetching consensus mock draft from nflmockdraftdatabase.com...');
  const html = await fetchPage('https://www.nflmockdraftdatabase.com/mock-drafts/2026/consensus-mock-draft-2026');

  const slots: Array<{ pick_number: number; consensus_player_name: string; consensus_rank: number }> = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const tdRegex  = /<td[^>]*>([\s\S]*?)<\/td>/g;

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowMatch[1])) !== null) {
      cells.push(stripTags(tdMatch[1]));
    }
    if (cells.length >= 3 && cells[0].match(/^\d+$/)) {
      const pick = parseInt(cells[0]);
      if (pick >= 1 && pick <= 32) {
        slots.push({
          pick_number: pick,
          consensus_player_name: cells[1].trim(),
          consensus_rank: parseInt(cells[3] ?? '0') || 0,
        });
      }
    }
  }

  console.log(`Parsed ${slots.length} mock draft slots`);
  return slots;
}

async function main() {
  const [board, mock] = await Promise.all([
    scrapeConsensusBoard(),
    scrapeConsensusMock(),
  ]);

  fs.writeFileSync('scripts/consensus_board.json', JSON.stringify(board, null, 2));
  fs.writeFileSync('public/mock_data.json', JSON.stringify(mock, null, 2));
  console.log('Saved consensus_board.json and public/mock_data.json');
}

main().catch(console.error);
