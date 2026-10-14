---
name: no-ai-slop
description: Use whenever you write or edit words a person will read on this site, in a PR, a README, an email to a recruiter, a reel caption or an AI prompt. Bans the words, phrases and sentence shapes that make writing read as machine-made, and tells you how to check copy with the repo's own detector.
---

# No AI slop

Adapted from Peter Yang's no-ai-slop skill (github.com/petergyang/no-ai-slop,
MIT). The rules live as code in `lib/no-ai-slop.ts`; this file is how to use
them.

## Write like a coach, a sports editor or a parent in the stands

- Lead with the fact: who, what, the score, the date. "Boys soccer beat
  Litchfield 4-0 to finish 9-0 in the SCC." Not "an incredible night of soccer".
- Names, numbers and places over adjectives. If a sentence could be pasted onto
  any other school's site, cut it or make it about Hillsboro.
- Active voice, direct verbs: "won", "set", "signed", "is". Not "serves as",
  "plays a vital role", "made a decision".
- Short. One point per sentence. Stop after the last real point.

## Never

- Words: delve, foster (outside foster care), leverage, utilize, facilitate,
  empower, streamline, robust, cutting-edge, paradigm shift, game changer,
  tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount,
  transformative, elevate, embark, supercharge, harness, ever-evolving.
- Phrases: it's worth noting, at the end of the day, when it comes to, at its
  core, in today's world, the reality is, the truth is, in terms of, going
  forward, let's dive in.
- Shapes: "It's not X, it's Y" and "not just X but Y"; "Here's the thing";
  "what nobody tells you"; colon reveals ("The best part: ..."); trailing
  "highlighting / showcasing / underscoring" clauses; "a testament to",
  "pivotal moment"; "as you can see"; "experts agree" or "studies show" without
  a named source; "What if I told you", "Plot twist:"; stacked dramatic
  fragments; "In conclusion / Ultimately / Overall" recaps.
- Em dashes, emoji, decorative bold.
- Invented facts. Sample athletes are marked `sample: true` and show a visible
  "Sample profile" tag; never present made-up numbers as a real student's.

## Check it

```bash
pnpm check:copy        # scans content/ and app/ strings, fails on a finding
pnpm test              # the detector's own tests
```

A finding prints the pattern, the words that tripped it and the fix. Rewrite
the sentence; don't reword around the regex. Quoted text in backticks is
ignored, so a news item may quote a headline verbatim.

## AI prompts

A prompt that writes copy for this site appends `WRITING_RULE` from
`lib/no-ai-slop.ts`. Emails to recruiters or families also append
`MESSAGE_RULES` and run the draft through `slopFindings()` before sending.
