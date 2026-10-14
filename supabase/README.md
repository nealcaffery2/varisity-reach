# Backend (Supabase)

The site runs without this. Until `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, every write stays in the visitor's
browser (demo mode) and the pages say so.

## What lives here

| Path | What it does |
| --- | --- |
| `migrations/001_core.sql` | Schools, profiles and verification, athletes, games, community score reports, paired streams, Underdog votes, fundraisers, gifts, gold cards. Row level security on every table. |
| `migrations/002_community.sql` | Conference pick'em, fan brackets, free fantasy; family links and uploads; notifications; recruiter stars, messages and private mailing addresses (reveals logged, family told); reel engagement and save lists; boosters, alumni stories, Sibling Superstars; wishlists; private academic feedback; school claims, feeds and news; gold card merchant offers. |
| `migrations/003_scouting.sql` | Recruiter needs and don't-want lists, highlight tapes (limits enforced by trigger), meet and greet requests, film requests to high school coaches, athlete socials, recruiter attention per school (counts only), notification settings, school wants board and votes, school board items. |
| `migrations/004_media.sql` | Photo and video creators, coverage requests, media items (private originals, public previews), licenses, media partners and their game links, paid game sponsors with the school's pledge, pledges on the wants board (faculty pledges need a verified staff account), and the weekly Shakiest Camera and Loudest Parent awards (entries need the person's consent). |
| `migrations/005_review_fixes.sql` | Only staff record a family release; previews stay private until approved; creators claim coverage, staff manage it; award votes must match an approved entry, and moderators review entries and clips; pledge totals are public and names are not; only verified people link coverage to games; the `license_payouts` ledger; school payout ids hidden from public reads. |
| `functions/payouts-sweep` | Pays license shares still owed (failed transfers, or a creator or school that connected a payout account later). Run on a schedule with the service-role key. |
| `functions/recruiter-contact` | A verified college coach writes to an athlete. Checks the NCAA contact calendar (holds early messages), copies every linked parent, emails through Resend or queues a printed letter. |
| `functions/feed-sync` | Reads school and newspaper RSS/Atom feeds into `news_items`. Run on a schedule with the service-role key, or by a verified AD for their school. |
| `functions/score-report` | Takes a score from the stands. Sets role and trust on the server, enforces the game window and a 30-second rate limit, lets only a verified coach or scorer of either team lock, and updates every reporter's trust after a final. |
| `functions/roster-import` | Claude reads a roster photo, PDF or Word text into athlete rows (structured output, `claude-opus-5-5`). Verified coaches only. Saves nothing. |
| `functions/publish-roster` | Saves the rows a coach approved, stamped with who verified them. New athletes stay hidden until a media release is recorded. |
| `functions/checkout` | Stripe Checkout for gifts, gold cards and game sponsors (destination charges to the school's connected account), and photo licenses (collected by the platform, then split by transfer). |
| `functions/stripe-webhook` | Records gifts, signs gold cards, marks sponsors paid, and records licenses and after card fees, records the photographer's (79%) and the school's (21%) shares in `license_payouts` and pays each by transfer with an idempotency key. Any failed write returns 500 so Stripe retries. Creator payout ids live in `media_creator_payouts`, readable by the service role only. |
| `functions/gold-card-claim`, `gold-card-verify` | Hand the buyer their card; check a card for a merchant. The signing key never leaves the server. |
| `functions/_shared` | Plumbing, a small Stripe client, and copies of `lib/consensus.ts` and `lib/gold-card.ts` (`pnpm sync:functions` keeps them in step; CI fails on drift). |

## Turn it on

1. Create a Supabase project. Run the files in `migrations/` in order in the SQL
   editor, or `supabase db push`.
2. Function secrets (Dashboard → Edge Functions → Secrets):
   - `ANTHROPIC_API_KEY` for roster reading
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `GOLD_CARD_SECRET`: a long random string; changing it voids every card
   - `REPORTER_SALT`: a long random string for hashing signed-out reporters
   - `RESEND_API_KEY` and `MAIL_FROM` for recruiter email (optional; without them, use letters)
   - `SITE_ORIGIN`: the site's origin, e.g. `https://varsityreach.org`
   - optional `PLATFORM_FEE_PCT` (default 0), `GOLD_CARD_PRICE_CENTS` (default 2000)
3. `supabase functions deploy` (config.toml marks the public ones).
4. In Stripe, point a webhook for `checkout.session.completed` at
   `…/functions/v1/stripe-webhook`.
5. For each school: onboard its booster club or district to Stripe Connect and
   put the account id in `schools.stripe_account` with `payee_name`.
6. Set the repo variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` so the Pages
   build leaves demo mode.

Verification is by hand for now: approve a row in `verification_requests`,
then set `role`, `school_slug` and `verified_at` on that person's `profiles`
row. Games are added to `games` from each school's schedule.

## Before taking real money

Talk to the district's business office. Most schools route outside gifts
through a booster club (often a 501(c)(3)); that club should be the Stripe
account, issue receipts, and handle any state rules on raffles and sales.
