/**
 * Scrapes nfldraftbuzz.com for player scout grades.
 * Run morning of draft: npx ts-node scripts/scrape_big_board.ts
 */

import * as fs from 'fs';
import * as https from 'https';

interface RawPlayer {
  name: string;
  position: string;
  school: string;
  buzz_grade: number;
}

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

function parseGrade(text: string): number {
  const match = text.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 50;
}

async function scrapeBigBoard(): Promise<RawPlayer[]> {
  console.log('Fetching nfldraftbuzz.com big board...');

  const html = await fetchPage('https://www.nfldraftbuzz.com/positions/ALL/1/2026');
  const players: RawPlayer[] = [];

  // Parse player rows — nfldraftbuzz uses a table with class="player-row"
  const rowRegex = /<tr[^>]*class="[^"]*player-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
  const tdRegex  = /<td[^>]*>([\s\S]*?)<\/td>/g;
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim();

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];
    const cells: string[] = [];
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(row)) !== null) {
      cells.push(stripTags(tdMatch[1]));
    }

    if (cells.length >= 4) {
      const name     = cells[1] || cells[0];
      const position = cells[2] || '';
      const school   = cells[3] || '';
      const grade    = parseGrade(cells[cells.length - 1]);

      if (name && position) {
        players.push({ name: name.trim(), position: position.trim(), school: school.trim(), buzz_grade: grade });
      }
    }
  }

  console.log(`Parsed ${players.length} players from nfldraftbuzz.com`);
  return players;
}

async function main() {
  const players = await scrapeBigBoard();
  fs.writeFileSync('scripts/big_board.json', JSON.stringify(players, null, 2));
  console.log('Saved to scripts/big_board.json');
}

main().catch(console.error);
