// Parser for IHSA conference schedule pages (as rendered markdown). Pure, so
// tools/ihsa.test.ts and the import tool share it.

export type ConfGame = {
  date: string; // ISO yyyy-mm-dd
  time: string; // "7:00"
  home: boolean;
  opponent: string; // normalized short name
  conference: boolean;
  result?: 'W' | 'L' | 'T';
  score?: { for: number; against: number };
  forfeit?: boolean;
};

export type ConfTeam = {
  name: string; // normalized, e.g. "Pana"
  ihsaName: string; // as IHSA writes it, e.g. "Pana (H.S.)"
  nickname?: string;
  headCoach?: string;
  enrollment?: number;
  conf: { w: number; l: number };
  overall: { w: number; l: number };
  oppWins: number;
  pointsFor: number;
  pointsAgainst: number;
  /** The playoff status letter IHSA prints beside the team (R, C or A), kept as given. */
  bid?: 'R' | 'C' | 'A';
  games: ConfGame[];
};

export type Conference = { name: string; sport: string; season: string; updated?: string; sourceUrl: string; retrieved: string; teams: ConfTeam[] };

/** "Pana (H.S.)" → "Pana", "Piasa (Southwestern)" → "Piasa Southwestern", "Virden (North Mac)" → "North Mac", "Staunton [Coop]" → "Staunton". */
export function normalizeName(raw: string): string {
  let s = raw.replace(/%20thumb\.png\?v=1\)/g, '').replace(/\\\*/g, '').replace(/\*/g, '').replace(/\\\[|\\\]/g, (m) => m.slice(1)).trim();
  s = s.replace(/\s*\[Coop\]\s*/i, '').trim();
  s = s.replace(/\s*\(H\.S\.\)\s*$/i, '');
  const m = s.match(/^(.+?)\s*\((.+)\)$/);
  if (m) {
    const [, town, inner] = m;
    // IHSA writes "Town (School)". Keep the name people say.
    if (/^(North Mac|Central)$/i.test(inner)) return /Central/i.test(inner) ? `${town} Central` : inner;
    return `${town} ${inner}`;
  }
  return s;
}

const MONTHS: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

/** Strip markdown images and links but keep link text. */
const clean = (md: string) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[((?:\\\]|[^\]])*)\]\([^)]*\)/g, '$1')
    .replace(/%20thumb\.png\?v=1\)/g, '');

export function parseIhsaConference(markdown: string, opts: { sourceUrl: string; season: number; retrieved?: string }): Conference {
  const md = clean(markdown);
  const lines = md.split('\n').map((l) => l.trim());
  const title = lines.find((l) => /^# .+Conference/.test(l))?.slice(2).trim() ?? 'Conference';
  const updated = lines.find((l) => l.startsWith('Updated '))?.replace('Updated ', '');

  // Standings table rows: | School | cw | cl | w | l | oppW | for | agst | bid |
  const standings = new Map<string, Omit<ConfTeam, 'games' | 'nickname' | 'headCoach' | 'enrollment'>>();
  for (const l of lines) {
    const cells = l.split('|').map((c) => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    if (cells.length === 9 && /^\d+$/.test(cells[1]) && /^\d+$/.test(cells[7])) {
      const ihsaName = cells[0].replace(/\\\[/g, '[').replace(/\\\]/g, ']');
      const name = normalizeName(ihsaName);
      if (standings.has(name)) continue;
      standings.set(name, {
        name,
        ihsaName,
        conf: { w: +cells[1], l: +cells[2] },
        overall: { w: +cells[3], l: +cells[4] },
        oppWins: +cells[5],
        pointsFor: +cells[6],
        pointsAgainst: +cells[7],
        bid: (['R', 'C', 'A'] as const).find((b) => b === cells[8]),
      });
    }
  }

  const teams: ConfTeam[] = [];
  let cur: ConfTeam | null = null;
  for (const l of lines) {
    const h = l.match(/^## (.+?) \(\d+-\d+\)/);
    if (h) {
      const name = normalizeName(h[1]);
      const base = standings.get(name);
      cur = base ? { ...base, games: [] } : { name, ihsaName: h[1], conf: { w: 0, l: 0 }, overall: { w: 0, l: 0 }, oppWins: 0, pointsFor: 0, pointsAgainst: 0, games: [] };
      teams.push(cur);
      continue;
    }
    if (!cur) continue;
    if (l.startsWith('Nickname:')) cur.nickname = l.slice(9).trim();
    else if (l.startsWith('Head Coach:')) cur.headCoach = l.slice(11).trim();
    else if (l.startsWith('Enrollment:')) cur.enrollment = Math.round(Number(l.slice(11).trim()));
    else {
      const row = l.match(/^\| (?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\w{3}) (\d{2}) \| ([\d:]+) \| (@|vs) \| (.+?) \| (W|L|T|—) \| ([^|]*) \|/);
      if (!row) continue;
      const [, mon, day, time, ha, oppRaw, result, score] = row;
      const month = MONTHS[mon];
      const year = month >= 7 ? opts.season : opts.season + 1;
      const conference = /\\\*|\*\s*$/.test(oppRaw);
      const opponent = normalizeName(oppRaw);
      const sc = score.match(/(\d+)\s*[–-]\s*(\d+)/);
      cur.games.push({
        date: `${year}-${String(month).padStart(2, '0')}-${day}`,
        time,
        home: ha === 'vs',
        opponent,
        conference,
        result: result === '—' ? undefined : (result as 'W' | 'L' | 'T'),
        score: sc ? { for: +sc[1], against: +sc[2] } : undefined,
        forfeit: /forfeit/i.test(opponent) || (sc ? (+sc[1] === 1 && +sc[2] === 0) || (+sc[1] === 0 && +sc[2] === 1) : false) || undefined,
      });
    }
  }
  return { name: title, sport: 'football', season: `${opts.season}-${String(opts.season + 1).slice(2)}`, updated, sourceUrl: opts.sourceUrl, retrieved: opts.retrieved ?? new Date().toISOString().slice(0, 10), teams };
}

/** Standings order: conference wins, then fewest conference losses, then overall, then points allowed. */
export function sortStandings(teams: readonly ConfTeam[]): ConfTeam[] {
  return [...teams].sort(
    (a, b) => b.conf.w - a.conf.w || a.conf.l - b.conf.l || b.overall.w - a.overall.w || a.pointsAgainst - b.pointsAgainst || a.name.localeCompare(b.name),
  );
}
