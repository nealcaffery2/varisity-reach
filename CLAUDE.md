# Hiltoppers

Static Next.js site (App Router, `output: 'export'`), Tailwind v4, Motion,
Lenis. Content is TypeScript in `content/`; there is no database.

```bash
pnpm install
pnpm dev            # localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm check:copy
pnpm build          # writes out/
```

## Content

- `content/site.ts` school facts and links. `content/sports.ts` teams,
  coaches, schedule PDFs. `content/news.ts` stories and district dates.
  `content/athletes.ts` profiles. `content/reels.ts` clips.
- Facts come from the school's own sites and say where they came from. Never
  invent a score, an honor or a stat for a real person.
- Every athlete in the template has `sample: true`. Keep that flag on anything
  made up; it shows a "Sample profile" tag, turns off contact and adds noindex.

## Writing (always)

Everything a person reads follows `.claude/skills/no-ai-slop/SKILL.md`.
`pnpm check:copy` runs every string through `lib/no-ai-slop.ts` and CI fails
on a finding.

## Design (always)

Any UI change goes through, in order:

1. `DESIGN.md`: tokens, type, motion, banned patterns. It wins conflicts.
2. **impeccable** (`.claude/skills/impeccable`): load it before editing UI and
   follow `reference/craft-floor.md`. Before pushing, run the detector on the
   built pages:
   `pnpm build && npx serve out -l 4173` then
   `.claude/skills/impeccable/scripts/impeccable detect http://localhost:4173/<page>`.
   In a cloud container set `IMPECCABLE_BROWSER` to a Chromium wrapper that
   passes `--no-sandbox`. Fix findings or say in the PR why one stands.
3. **design-taste-frontend** (`.claude/skills/design-taste-frontend`): full
   loading, empty and error states, labels above inputs, one accent.
4. Vercel Web Interface Guidelines: named icon buttons, 44px touch targets,
   visible focus, confirm destructive actions.

Screenshot desktop (1440) and phone (390) before calling a UI change done and
put the shots in the PR.
