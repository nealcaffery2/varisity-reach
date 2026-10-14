// Turns an IHSA conference schedules page into content/conference/*.json.
// IHSA renders its pages in the browser, so the input is the page as
// rendered markdown (Firecrawl's scrape, saved under data/sources/). The
// output keeps the source URL and the time IHSA says it last updated.
//
// Run: npx tsx tools/import-ihsa-conference.ts data/sources/ihsa-scc-football-2026-27.json content/conference/scc-football-2026.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseIhsaConference } from '../lib/ihsa';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: tsx tools/import-ihsa-conference.ts <firecrawl-json> <out.json>');
  process.exit(1);
}
const raw = JSON.parse(readFileSync(input, 'utf8'));
const parsed = parseIhsaConference(raw.markdown, { sourceUrl: raw.metadata?.sourceURL ?? raw.metadata?.url ?? '', season: 2026 });
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(parsed, null, 2) + '\n');
console.log(`${parsed.teams.length} teams, ${parsed.teams.reduce((n, t) => n + t.games.length, 0)} games → ${output}`);
