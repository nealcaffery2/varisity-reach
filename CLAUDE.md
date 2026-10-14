# Varsity Reach

Static Next.js site (App Router, `output: 'export'`), Tailwind v4, Motion,
Lenis. Content and sample data are TypeScript in `content/`. The live backend
is Supabase (`supabase/`: migrations, Deno edge functions); `lib/backend.ts`
is the only door to it and falls back to demo mode when unconfigured.

Routes: `app/(platform)/` is the network (home, recruits, athletes, games,
spotlight, compare, coach, fundraise, gold-card, schools, join).
`app/[school]/` is each school's own site, themed by `schoolTheme()`.
`app/overlay/` is the bare OBS scoreboard.

Pure logic with tests in `tools/*.test.ts`: filters, consensus scoring,
streams, fundraising and gold cards, compare, roster parsing. Edge functions
share `lib/consensus.ts` and `lib/gold-card.ts` through copies in
`supabase/functions/_shared`; run `pnpm sync:functions` after editing them.
Roster reading calls Claude (`claude-opus-5-5`, structured output) from
`supabase/functions/roster-import`.

```bash
pnpm install
pnpm dev            # localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm check:copy
pnpm build          # writes out/
cd supabase/functions && deno check --config deno.json */index.ts
```

## Content

- `content/schools.ts` schools and colors. `content/sports.ts` teams,
  coaches, schedule PDFs. `content/news.ts` stories, tickers and district
  dates. `content/athletes.ts` profiles. `content/reels.ts` clips.
  `content/games.ts`, `spotlight.ts`, `benchmarks.ts`, `fundraising.ts`.
- Facts come from the school's own sites and say where they came from. Never
  invent a score, an honor or a stat for a real person.
- Everything invented carries `sample: true` (schools, athletes, games,
  spotlights, fundraisers, gold card offers, reference recruits). Keep that
  flag on anything made up; it shows a sample tag and adds noindex. Never put
  a real player's name next to an invented stat, and never give a real
  school an invented game score.

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
