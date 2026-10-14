// Reads a roster or stat sheet with Claude: a phone photo, a PDF, or the text
// of a Word document. Returns athlete rows in the same shape the browser's
// spreadsheet parser produces (lib/roster.ts ImportedAthlete). Nothing is
// saved here; the coach reviews the rows and publishes with publish-roster.
import Anthropic from 'npm:@anthropic-ai/sdk@0.133.0';
import { caller, fail, json, profileOf, serve, isVerified } from '../_shared/http.ts';

const client = new Anthropic(); // ANTHROPIC_API_KEY from the function's secrets

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['athletes', 'notes'],
  properties: {
    notes: { type: 'string', description: 'Anything unreadable or ambiguous, for the coach. Empty if none.' },
    athletes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['first', 'last', 'jersey', 'position', 'gradYear', 'heightIn', 'weightLb', 'gpa', 'measurables', 'stats', 'warnings'],
        properties: {
          first: { type: 'string' },
          last: { type: 'string' },
          jersey: { type: ['integer', 'null'] },
          position: { type: ['string', 'null'] },
          gradYear: { type: ['integer', 'null'], description: 'Graduation year. Convert Fr/So/Jr/Sr using the season given.' },
          heightIn: { type: ['integer', 'null'], description: 'Total inches. 6-2 is 74.' },
          weightLb: { type: ['integer', 'null'] },
          gpa: { type: ['number', 'null'] },
          measurables: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, required: ['label', 'value'], properties: { label: { type: 'string' }, value: { type: 'string' } } },
          },
          stats: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, required: ['key', 'value'], properties: { key: { type: 'string' }, value: { type: 'number' } } },
          },
          warnings: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as const;

const STAT_KEYS: Record<string, string> = {
  football: 'passYds, passTd, rushYds, rushTd, recYds, tackles, sacks, int',
  'girls-flag-football': 'passYds, passTd, rushYds, recYds, int',
  'boys-basketball': 'ppg, rpg, apg, spg, fgPct, threePct',
  'girls-basketball': 'ppg, rpg, apg, spg, fgPct, threePct',
  wrestling: 'wins, losses, pins, takedowns',
  'track-and-field': 'm100, m200, m400 (seconds), m1600 (seconds), longJump (feet as decimal), shotPut (feet as decimal)',
  volleyball: 'kills, digs, aces, blocks, hitPct',
  baseball: 'avg, hr, rbi, sb, era, so',
  softball: 'avg, hr, rbi, sb, era, so',
  'boys-soccer': 'goals, assists, saves',
  'girls-soccer': 'goals, assists, saves',
  'boys-golf': 'avg9, avg18, low18',
  'girls-golf': 'avg9, avg18, low18',
  'boys-tennis': 'singlesW, singlesL, doublesW, doublesL',
  'girls-tennis': 'singlesW, singlesL, doublesW, doublesL',
};

serve(async (req) => {
  const user = await caller(req);
  if (!user) return fail('Sign in as a coach to read rosters.', 401);
  const profile = await profileOf(user.id);
  if (!isVerified(profile, ['coach', 'athletic director'])) return fail('Roster reading is for verified coaches. Request verification first.', 403);

  const body = await req.json().catch(() => null);
  const file = body?.file;
  const sport = String(body?.sport ?? '');
  if (!file?.mediaType || (!file.base64 && !file.text)) return fail('Send a file.');
  if (file.base64 && file.base64.length > 20_000_000) return fail('That file is too big. Send one page or a photo.');

  const now = new Date();
  const seasonEnd = now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
  const content: Anthropic.ContentBlockParam[] = [];
  if (file.mediaType === 'application/pdf') content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } });
  else if (file.mediaType.startsWith('image/')) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: file.base64 } });
  else content.push({ type: 'text', text: `<document>\n${String(file.text).slice(0, 200_000)}\n</document>` });
  content.push({
    type: 'text',
    text: [
      `This is a high school ${sport.replace(/-/g, ' ')} roster or stat sheet from a coach. Extract one entry per athlete.`,
      `The season ends in ${seasonEnd}, so a senior graduates in ${seasonEnd} and a freshman in ${seasonEnd + 3}.`,
      `Season stats use these keys only: ${STAT_KEYS[sport] ?? 'none'}. Leave stats empty when the sheet has none.`,
      'Measurables are things like 40 yd, Vertical, Bench, Squat, Pro agility, Wingspan; keep the value as written with units.',
      'Copy what is written. Never guess a number. If a cell is unreadable, leave the field null and add a short warning.',
      'Handwriting can be messy: read names carefully and flag any you are unsure of in warnings.',
    ].join('\n'),
  });

  const res = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    // deno-lint-ignore no-explicit-any
    fallbacks: 'default' as any,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content }],
  } as Anthropic.Beta.MessageCreateParamsNonStreaming);

  if (res.stop_reason === 'refusal') return fail('The reader could not process that file. Try a spreadsheet export instead.', 422);
  if (res.stop_reason === 'max_tokens') return fail('That roster is too long to read in one go. Send it a page at a time.', 422);
  const text = res.content.find((b) => b.type === 'text');
  if (!text || text.type !== 'text') return fail('The reader returned nothing. Try a clearer photo.', 422);
  const parsed = JSON.parse(text.text) as { athletes: { measurables: { label: string; value: string }[]; stats: { key: string; value: number }[]; [k: string]: unknown }[]; notes: string };

  // Same shape as the browser parser.
  const athletes = parsed.athletes.map((a) => ({
    ...Object.fromEntries(Object.entries(a).filter(([, v]) => v !== null)),
    measurables: Object.fromEntries(a.measurables.map((m) => [m.label, m.value])),
    stats: Object.fromEntries(a.stats.map((s) => [s.key, s.value])),
  }));
  return json({ athletes, notes: parsed.notes });
});
