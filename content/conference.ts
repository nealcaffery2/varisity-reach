import scc from './conference/scc-football-2026.json';
import il from './directory/il.json';
import type { Conference, ConfTeam } from '@/lib/ihsa';
import { sortStandings } from '@/lib/ihsa';
import { accentFor } from '@/lib/school-colors';
import type { Seed } from '@/lib/bracket';

// Real conference data. Standings, schedules, coaches and enrollment come
// from IHSA's conference schedule page (tools/import-ihsa-conference.ts);
// colors come from IHSA's school directory API (tools/import-ihsa-directory.ts).
// Nothing here is invented.

export type ConfSchool = {
  name: string;
  ihsaName: string;
  ihsaId?: string;
  formal?: string;
  nickname?: string;
  colors: string[];
  accent: string;
  accentDeep: string;
  /** Slug of the school's site on the network, when it has one. */
  site?: string;
};

type IlSchool = { ihsaId: string; ihsaName: string; name: string; colors: string[] };
const directory = (il as { schools: IlSchool[] }).schools;
const SITES: Record<string, string> = { Hillsboro: 'hillsboro' };

export type ConferenceHub = Conference & { slug: string; short: string; schools: Record<string, ConfSchool>; directorySource: string };

function build(slug: string, short: string, c: Conference): ConferenceHub {
  const schools: Record<string, ConfSchool> = {};
  for (const t of c.teams) {
    const ihsaName = t.ihsaName.replace(/\s*\[Coop\]/i, '').replace(/\s*\(H\.S\.\)/, '');
    const d = directory.find((x) => x.ihsaName === ihsaName);
    const colors = d?.colors ?? [];
    const a = accentFor(colors);
    schools[t.name] = { name: t.name, ihsaName, ihsaId: d?.ihsaId, formal: d?.name, nickname: t.nickname, colors, accent: a.accent, accentDeep: a.accentDeep, site: SITES[t.name] };
  }
  return { ...c, slug, short, schools, teams: sortStandings(c.teams), directorySource: (il as { source: string }).source };
}

export const conferences: ConferenceHub[] = [build('scc', 'SCC', scc as Conference)];
export const conferenceBySlug = (slug: string) => conferences.find((c) => c.slug === slug);

export type Fixture = { key: string; date: string; time: string; home: string; away: string; conference: boolean; final?: { home: number; away: number }; forfeit?: boolean };

/**
 * Every game once, from the home team's side. Games against teams outside
 * the conference appear once from the conference team's schedule.
 */
export function fixtures(c: Conference): Fixture[] {
  const seen = new Map<string, Fixture>();
  for (const t of c.teams) {
    for (const g of t.games) {
      const home = g.home ? t.name : g.opponent;
      const away = g.home ? g.opponent : t.name;
      const key = `${g.date}:${away}@${home}`;
      if (seen.has(key)) continue;
      const final = g.score ? (g.home ? { home: g.score.for, away: g.score.against } : { home: g.score.against, away: g.score.for }) : undefined;
      seen.set(key, { key, date: g.date, time: g.time, home, away, conference: g.conference, final, forfeit: g.forfeit });
    }
  }
  return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date) || a.home.localeCompare(b.home));
}

/** The Friday of a game's week, so Thursday and Saturday games join their week. */
export function fridayOf(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -2 : 5 - dow));
  return d.toISOString().slice(0, 10);
}

/** Games grouped into football weeks, numbered from the first. */
export function weeks(c: Conference) {
  const by = new Map<string, Fixture[]>();
  for (const f of fixtures(c)) {
    const k = fridayOf(f.date);
    by.set(k, [...(by.get(k) ?? []), f]);
  }
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, games], i) => ({ week: i + 1, date, games }));
}

/** The first week with a game still to play, or the last week if the season is done. */
export function currentWeek(c: Conference) {
  const ws = weeks(c);
  return ws.find((w) => w.games.some((g) => !g.final)) ?? ws[ws.length - 1];
}

/** Fan bracket seeds: the top eight in the current standings. */
export const bracketSeeds = (c: Conference): Seed[] => sortStandings(c.teams).slice(0, 8).map((t: ConfTeam, i) => ({ seed: i + 1, team: t.name }));

export const record = (r: { w: number; l: number }) => `${r.w}-${r.l}`;
