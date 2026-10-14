// Runs every piece of copy on the site through the no-AI-slop detector.
// Copy = string literals in content/ and the JSX text in app/ and components/.
// Exits 1 on a finding so CI blocks it. Run: pnpm check:copy
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { slopFindings } from '../lib/no-ai-slop';

const ROOT = new URL('..', import.meta.url).pathname;
const DIRS = ['content', 'app', 'components'];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|md)$/.test(name) ? [p] : [];
  });

// Prose only: strings with a space and a word in them. Keys and URLs skip.
const isProse = (s: string) => /\s/.test(s) && /[a-z]{3}/i.test(s);

let problems = 0;
for (const file of DIRS.flatMap((d) => walk(join(ROOT, d)))) {
  const src = readFileSync(file, 'utf8');
  const pieces: { text: string; line: number }[] = [];
  const add = (text: string, index: number) => pieces.push({ text, line: src.slice(0, index).split('\n').length });
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) add(m[1] ?? m[2] ?? '', m.index ?? 0);
  if (file.endsWith('.tsx')) for (const m of src.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) add(m[1], m.index ?? 0);
  for (const { text, line } of pieces) {
    if (!isProse(text)) continue;
    for (const f of slopFindings(text, { skip: ['decorative bold'] })) {
      problems++;
      console.log(`${relative(ROOT, file)}:${line}  ${f.pattern} ("${f.quote}"): ${f.fix}`);
    }
  }
}

if (problems) {
  console.log(`\n${problems} slop finding${problems === 1 ? '' : 's'}. Rewrite the sentence, see .claude/skills/no-ai-slop/SKILL.md`);
  process.exit(1);
}
console.log('check-copy: clean');
