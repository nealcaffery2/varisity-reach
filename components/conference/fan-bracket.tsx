'use client';

import { useEffect, useState } from 'react';
import { Crown, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { ConfSchool } from '@/content/conference';
import { bracketWithPicks, champion, pick, type Picks, type Seed } from '@/lib/bracket';
import { myBracket, saveBracket } from '@/lib/community';
import { Swatch } from './team-mark';

const ROUND_NAMES = ['Quarterfinals', 'Semifinals', 'Final'];

/**
 * A fan bracket seeded from the real standings. IHSA's playoffs are statewide
 * by class, so this is the conference tournament fans argue about, not one
 * that gets played.
 */
export function FanBracket({ conf, seeds, schools }: { conf: string; seeds: Seed[]; schools: Record<string, ConfSchool> }) {
  const [picks, setPicks] = useState<Picks>({});
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicks(myBracket(conf));
  }, [conf]);

  const seedOf = Object.fromEntries(seeds.map((s) => [s.team, s.seed]));
  const rounds = bracketWithPicks(seeds, picks);
  const champ = champion(seeds, picks);

  const choose = async (id: string, team?: string) => {
    if (!team) return;
    const next = pick(seeds, picks, id, team);
    setPicks(next);
    const r = await saveBracket(conf, next);
    setMsg(r.ok ? (r.demo ? 'Saved in this browser.' : 'Bracket saved.') : r.reason);
  };

  const reset = async () => {
    if (!window.confirm('Clear every pick in your bracket?')) return;
    setPicks({});
    await saveBracket(conf, {});
    setMsg('Bracket cleared.');
  };

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 no-scrollbar">
        <ol className="grid min-w-[46rem] grid-cols-4 gap-4">
          {rounds.map((round, r) => (
            <li key={r} className="flex flex-col">
              <h3 className="text-sm font-semibold text-mute">{ROUND_NAMES[r]}</h3>
              <ul className="mt-3 flex flex-1 flex-col justify-around gap-4">
                {round.map((m) => (
                  <li key={m.id} className="overflow-hidden rounded border border-line bg-ink-2">
                    {[m.a, m.b].map((team, i) => {
                      const on = team && picks[m.id] === team;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={!team}
                          aria-pressed={Boolean(on)}
                          onClick={() => choose(m.id, team)}
                          className={`flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm transition-colors ${i === 0 ? 'border-b border-line' : ''} ${on ? 'bg-accent/15 text-bone' : 'text-mute hover:bg-ink-3 hover:text-bone'} disabled:cursor-default disabled:hover:bg-transparent`}
                        >
                          {team ? (
                            <>
                              <span className="num w-4 text-xs text-dim">{seedOf[team]}</span>
                              <Swatch school={schools[team]} size={12} />
                              <span className="min-w-0 flex-1 truncate font-semibold">{team}</span>
                            </>
                          ) : (
                            <span className="text-dim">Winner of the game before</span>
                          )}
                        </button>
                      );
                    })}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          <li className="flex flex-col">
            <h3 className="text-sm font-semibold text-mute">Champion</h3>
            <div className="mt-3 flex flex-1 items-center">
              <div className={`w-full rounded border p-4 ${champ ? 'border-accent' : 'border-dashed border-line-2'}`}>
                {champ ? (
                  <>
                    <Crown size={28} weight="fill" className="text-accent" aria-hidden />
                    <p className="display mt-2 text-4xl">{champ}</p>
                    <p className="mt-1 text-sm text-mute">{schools[champ]?.nickname}</p>
                  </>
                ) : (
                  <p className="text-sm text-dim">Pick a winner in every game to crown one.</p>
                )}
              </div>
            </div>
          </li>
        </ol>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-ghost" onClick={reset} disabled={!Object.keys(picks).length}>
          <ArrowCounterClockwise size={16} /> Start over
        </button>
        <p className="text-sm text-mute" role="status">{msg}</p>
      </div>
    </div>
  );
}
