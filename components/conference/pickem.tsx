'use client';

import { useEffect, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import type { ConfSchool, Fixture } from '@/content/conference';
import { myPicks, pickCounts, savePick } from '@/lib/community';
import { pickShare } from '@/lib/bracket';
import { Swatch } from './team-mark';

const day = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

type Props = { conf: string; week: number; games: Fixture[]; schools: Record<string, ConfSchool>; past: Fixture[] };

/** Pick a winner for every game this week. Fans see the crowd split once real picks exist; demo mode shows only your own. */
export function Pickem({ conf, week, games, schools, past }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks(myPicks(conf));
    pickCounts(conf).then(setCounts);
  }, [conf]);

  const choose = async (g: Fixture, team: string) => {
    setPicks((p) => ({ ...p, [g.key]: team }));
    const r = await savePick(conf, g.key, team);
    setMsg(r.ok ? (r.demo ? 'Saved in this browser. Sign-in saves picks to your account once the site is live.' : 'Pick saved.') : r.reason);
  };

  // Season record from games already played that this browser picked.
  const graded = past.filter((g) => g.final && picks[g.key]);
  const right = graded.filter((g) => picks[g.key] === (g.final!.home > g.final!.away ? g.home : g.away)).length;
  const open = games.filter((g) => !g.final);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-mute">Week {week}. Picks lock at kickoff.</p>
        {graded.length > 0 && <p className="num text-sm text-mute">Your record <span className="text-bone">{right}-{graded.length - right}</span></p>}
      </div>
      <ul className="mt-5 grid gap-px overflow-hidden rounded border border-line bg-line">
        {open.map((g) => {
          const share = pickShare(counts[g.key] ?? {});
          const total = Object.values(counts[g.key] ?? {}).reduce((a, b) => a + b, 0);
          return (
            <li key={g.key} className="bg-ink p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 text-xs text-dim">
                <span>{g.conference ? 'Conference game' : 'Nonconference'}</span>
                <span className="num">{day(g.date)} {g.time} pm{total > 0 && ` · ${total} picks`}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[g.away, g.home].map((team) => {
                  const on = picks[g.key] === team;
                  return (
                    <button
                      key={team}
                      type="button"
                      aria-pressed={on}
                      onClick={() => choose(g, team)}
                      className={`relative flex min-h-12 min-w-0 items-center gap-2 overflow-hidden rounded-sm border px-3 py-2 text-left transition-colors ${on ? 'border-accent bg-accent/10 text-bone' : 'border-line-2 text-mute hover:border-dim hover:text-bone'}`}
                    >
                      {total > 0 && <span aria-hidden className="absolute inset-y-0 left-0 bg-bone/5" style={{ width: `${share[team] ?? 0}%` }} />}
                      <Swatch school={schools[team]} />
                      <span className="relative min-w-0 flex-1 truncate font-semibold">{team}</span>
                      <span className="relative text-xs text-dim">{team === g.home ? 'home' : 'away'}</span>
                      {on && <Check size={16} weight="bold" className="relative text-accent" aria-label="Your pick" />}
                      {total > 0 && <span className="num relative text-xs text-mute">{share[team] ?? 0}%</span>}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {open.length === 0 && <p className="mt-4 text-mute">Every game this week is final. Next week’s slate opens when IHSA posts it.</p>}
      <p className="mt-3 min-h-5 text-sm text-mute" role="status">{msg}</p>
    </div>
  );
}
