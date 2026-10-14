// Edge functions run on Deno and deploy from supabase/functions only, so the
// pure libraries they share with the site are copied into _shared. Run after
// changing lib/consensus.ts or lib/gold-card.ts; `--check` fails CI on drift.
// Run: npx tsx tools/sync-functions.ts [--check]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const FILES = ['consensus.ts', 'gold-card.ts', 'recruiting-rules.ts', 'feeds.ts', 'media.ts'];
const HEADER = '// GENERATED from lib/ by tools/sync-functions.ts. Edit the lib/ copy, then run `pnpm sync:functions`.\n';
const check = process.argv.includes('--check');
let drift = 0;

for (const f of FILES) {
  const want = HEADER + readFileSync(`${ROOT}lib/${f}`, 'utf8');
  const path = `${ROOT}supabase/functions/_shared/${f}`;
  const have = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (have === want) continue;
  if (check) { console.error(`out of date: supabase/functions/_shared/${f}`); drift++; }
  else { writeFileSync(path, want); console.log(`wrote supabase/functions/_shared/${f}`); }
}
if (drift) process.exit(1);
if (check) console.log('sync-functions: in step');
