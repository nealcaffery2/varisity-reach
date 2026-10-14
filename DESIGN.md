# Varsity Reach design system

This file is the authority for how the site looks and moves. It wins any
conflict with a skill's defaults. Tokens live in `app/globals.css` (`@theme`);
if this file and the tokens disagree, the tokens win and this file gets fixed.

## The world

Friday night under the lights in a small town. A dark field, white chalk
type, one hot accent. Every page should feel like the scoreboard, the program
and the film room, not a school district template. The accent belongs to
whoever owns the page: Varsity Reach signal orange on network pages, the
school's color on its own pages and on its athletes' profiles.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `ink` | `#0c0c0d` | Page background. Off-black, never `#000`. |
| `ink-2` | `#141416` | Raised surfaces, table heads, cards. |
| `ink-3` | `#1d1d20` | Inputs, hover fills. |
| `line` / `line-2` | `#2a2a2e` / `#3a3a40` | Hairlines and borders. |
| `bone` | `#f3f1ee` | Primary text; the one light section (reels on home). |
| `mute` | `#a6a6ad` | Secondary text (8:1 on ink). |
| `dim` | `#8a8a92` | Tertiary text (5.3:1 on ink-2). Never lighter. |
| `accent` | `#ff5b1f` | Varsity Reach orange. Schools override all four accent tokens (`schoolTheme()` in `content/schools.ts`); Hillsboro's is `#ff7f00`, sampled from the H logo. |
| `accent-2` | `#ff7d4d` | Hover, and accent text over video. |
| `accent-ink` | `#1f0800` | Text on accent buttons. |
| `accent-deep` | `#b23a0b` | Accent text on bone. |
| `danger` | `#ff8a7a` | Errors and invalid states. |
| `ok` | `#7bd88f` | A valid gold card. |

A school accent must reach 4.5:1 against `ink` and its `accent-ink` must
reach 4.5:1 on the accent. Lighten dark school colors (maroon becomes
`#e8546a`, navy schools lead with their gold).

Rules: one accent, used for the primary action, the active state, the lead
number in a stat block, and the second word of a headline. No gradients on
text, no glows. Footage is graded grayscale with an orange multiply layer
(the "duotone"), which is how the brand gets into photos without stickers.

## Type

- Display: **Big Shoulders** 900, uppercase, `line-height: 0.86`, class
  `.display`. Headlines, team names, athlete names, big dates. Chicago-drawn
  condensed grotesque; reads like stadium lettering.
- Body: **Barlow** 400 to 700. Labels, paragraphs, buttons. (Geist was flagged as overused by the detector and replaced.)
- Numbers: **Geist Mono** with tabular figures, class `.num`. Every stat,
  height, weight, GPA and time, so columns line up.
- Scale: display runs from `text-3xl` (sidebars) to `clamp(4rem, 17vw, 15rem)`
  (the hero). Body is 16px, secondary 14px, captions 12px.
- Never set body copy in the display face. Never use the mono face for words.

## Shape and depth

- Radius: `2px` (`rounded-sm`) and `4px` (`rounded`) only. Chips and the
  season switcher are full pills; nothing else is.
- Depth comes from `ink` → `ink-2` steps and 1px lines. One shadow exists (the
  QR popover) and it carries an offset.
- Grids of tiles use `gap-px` on a `bg-line` parent, so the gaps are the rules.

## Motion

One authored moment per page, then quiet.

- Home: the hero letters rise in one by one, the video scales and the copy
  lifts as you scroll; athletes pan sideways in a pinned section on desktop.
- Team rows: a clip follows the cursor on hover (desktop pointer only).
- Everything else: `Reveal` (24px rise, 0.7s, `cubic-bezier(0.16, 1, 0.3, 1)`).
- Smooth scrolling (Lenis) runs on desktop pointers only.
- `prefers-reduced-motion`: no letter rise, no parallax, no pinned pan, no
  autoplay; content renders in place.
- Never `window.addEventListener('scroll')`. Use Motion's `useScroll` or
  IntersectionObserver.

## Components

| Component | File | Notes |
| --- | --- | --- |
| Hero | `components/home/hero.tsx` | Video, duotone, letter rise. |
| Ticker | `components/home/ticker.tsx` | CSS marquee, pauses on hover. |
| Slider | `components/slider.tsx` | Native snap, mouse drag, arrows, progress line. |
| Season teams | `components/home/season-teams.tsx` | Tabs plus cursor clip. |
| Athlete card | `components/athlete-card.tsx` | Jersey number is the portrait. |
| Recruit board | `components/recruit-board.tsx` | Filters in the URL, card and table views, phone sheet. |
| Share bar | `components/share-bar.tsx` | Native share, copy, X, Facebook, email, QR, print. |
| Reel feed | `components/reel-feed.tsx` | Full-screen vertical snap, double-tap like, school filter. |
| Score bar | `components/game/scorebug.tsx` | Broadcast-style; the same component is the OBS overlay. |
| Game center | `components/game/game-center.tsx` | Community score, agreement meter, report sheet, streams. |
| Compare | `components/compare-tool.tsx` | Mirrored bars, accent marks the edge. |
| Campaign | `components/fundraise/campaign-view.tsx` | Milestone track, squad race, backer tiers. |
| Gold card | `components/fundraise/gold-card.tsx` | The one place gold appears. |
| Roster import | `components/coach/roster-import.tsx` | Drop zone, skeleton while reading, diff table. |

## Copy

Plain, specific, sports-page voice. Follow `.claude/skills/no-ai-slop`. No
eyebrows over headings, no section numbers, no em dashes. Buttons name the
action in one to three words. Sample data always says it is sample data.

## Banned here

Purple anything, gradient text, glass cards as decoration, emoji as icons,
stock faces of "students", 3 equal feature cards, centered hero copy,
placeholder-as-label, `#000`.
