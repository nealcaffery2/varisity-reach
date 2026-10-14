// Pulls every open public high school in a state from the NCES Common Core of
// Data via the Urban Institute Education Data API (free, no key) into
// data/nces/<st>.json. Run for any state: npx tsx tools/import-nces.ts IL [year]
import { mkdirSync, writeFileSync } from 'node:fs';
import { ccdUrl, FIPS, isHighSchool, toNational, type CcdRow } from '../lib/nces';

const state = (process.argv[2] ?? '').toUpperCase();
const year = Number(process.argv[3] ?? 2022);
if (!FIPS[state]) {
  console.error('usage: tsx tools/import-nces.ts <state, e.g. IL> [year]');
  process.exit(1);
}
let url: string | null = ccdUrl(state, year);
const rows: CcdRow[] = [];
while (url) {
  const res = await fetch(url, { headers: { 'user-agent': 'VarsityReach school directory import' } });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  const page = (await res.json()) as { results: CcdRow[]; next: string | null };
  rows.push(...page.results);
  url = page.next;
}
const schools = rows.filter(isHighSchool).map(toNational).sort((a, b) => a.name.localeCompare(b.name));
mkdirSync('data/nces', { recursive: true });
writeFileSync(`data/nces/${state.toLowerCase()}.json`, JSON.stringify(schools) + '\n');
console.log(`${rows.length} schools read, ${schools.length} high schools → data/nces/${state.toLowerCase()}.json`);
