// Builds content/directory/il.json: every IHSA member school with official
// colors, location and type, joined to NCES (website, enrollment) when
// data/nces/il.json is present (tools/import-nces.ts IL).
//
// Input is the JSON from https://api.ihsa.org/v1/schools, saved to
// data/sources/ihsa-schools-api.json. IHSA blocks most cloud IPs, so fetch it
// from a normal connection (or through a scraping service) and save the body.
//
// Run: npx tsx tools/import-ihsa-directory.ts data/sources/ihsa-schools-api.json content/directory/il.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fromIhsaApi, type IhsaApiSchool } from '../lib/ihsa-directory';
import { matchKey, type NationalSchool } from '../lib/nces';

const [input, out] = process.argv.slice(2);
if (!input || !out) {
  console.error('usage: tsx tools/import-ihsa-directory.ts <ihsa-schools-api.json> <out.json>');
  process.exit(1);
}
const nces: NationalSchool[] = existsSync('data/nces/il.json') ? JSON.parse(readFileSync('data/nces/il.json', 'utf8')) : [];
const byKey = new Map(nces.map((n) => [matchKey(n.name, n.town), n]));

const rows = (JSON.parse(readFileSync(input, 'utf8')) as { data: IhsaApiSchool[] }).data;
const schools = rows
  .map(fromIhsaApi)
  .map((s) => {
    const n = byKey.get(matchKey(s.name, s.town));
    return { ...s, ncesId: n?.ncesId, website: s.website ?? n?.website, enrollment: s.enrollment ?? n?.enrollment };
  })
  .sort((a, b) => a.ihsaName.localeCompare(b.ihsaName));

writeFileSync(out, JSON.stringify({ source: 'https://api.ihsa.org/v1/schools', retrieved: new Date().toISOString().slice(0, 10), count: schools.length, schools }) + '\n');
console.log(`${schools.length} schools, ${schools.filter((s) => s.colors.length).length} with official colors, ${schools.filter((s) => s.ncesId).length} matched to NCES → ${out}`);
