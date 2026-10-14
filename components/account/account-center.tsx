'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, Check, X } from '@phosphor-icons/react';
import { athleteBySlug, fullName } from '@/content/athletes';
import {
  answerFilm, answerMeet, demoFilm, demoLinks, demoMeets, demoNotices, demoPrefs, myStars, NOTICE_KINDS, savePrefs, setDemoViewer, viewer,
  type FilmRequest, type MeetRequest, type Notice, type Prefs, type Viewer,
} from '@/lib/community';

const ROLES: { role: Viewer['role']; label: string }[] = [
  { role: 'guest', label: 'Signed out' },
  { role: 'fan', label: 'Fan' },
  { role: 'parent', label: 'Parent' },
  { role: 'athlete', label: 'Athlete' },
  { role: 'recruiter', label: 'Verified recruiter' },
  { role: 'coach', label: 'Verified HS coach' },
];

const NOTICE_TEXT: Record<Notice['kind'], string> = {
  recruiter_star: 'A verified recruiter starred this profile.',
  recruiter_message: 'A recruiter wrote.',
  address_viewed: 'A recruiter viewed the mailing address.',
  recruiter_feedback: 'A recruiter left feedback on a reel.',
};

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function AccountCenter() {
  const [v, setV] = useState<Viewer | null>(null);
  const [notices, setNotices] = useState<(Notice & { athlete: string })[]>([]);
  const [meets, setMeets] = useState<MeetRequest[]>([]);
  const [film, setFilm] = useState<FilmRequest[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({ email: true, sms: false, push: true, muted: [] });
  const [stars, setStars] = useState<string[]>([]);
  const [filmUrl, setFilmUrl] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const load = () => {
    viewer().then(setV);
    const links = demoLinks();
    const watched = new Set([...links.map((l) => l.athlete), ...myStars()]);
    setNotices([...watched].flatMap((a) => demoNotices(a).map((n) => ({ ...n, athlete: a }))).sort((a, b) => b.at.localeCompare(a.at)));
    setMeets(demoMeets());
    setFilm(demoFilm());
    setPrefs(demoPrefs());
    setStars(myStars());
  };
  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (!v) return <div className="h-40 animate-pulse rounded bg-ink-2" aria-hidden />;

  const updatePrefs = async (p: Prefs) => {
    setPrefs(p);
    const r = await savePrefs(p);
    setMsg(r.ok ? 'Notification settings saved.' : r.reason);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid min-w-0 content-start gap-12">
        {v.demo && (
          <section aria-labelledby="role-h" className="rounded border border-line-2 p-5">
            <h2 id="role-h" className="font-semibold text-bone">Try it as</h2>
            <p className="mt-1 text-sm text-mute">The site is in demo mode, so there are no real accounts. Pick a role to see what each person sees.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button key={r.role} type="button" className="chip" aria-pressed={v.role === r.role} onClick={() => { setDemoViewer({ role: r.role, verified: r.role === 'recruiter' || r.role === 'coach' }); load(); }}>{r.label}</button>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="notes-h">
          <h2 id="notes-h" className="display flex items-center gap-3 text-4xl"><Bell size={28} className="text-accent" aria-hidden /> Notifications</h2>
          {notices.length === 0 ? (
            <p className="mt-4 text-mute">Nothing yet. When a recruiter stars, writes to or asks to meet an athlete you are linked to, it shows up here and by email.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {notices.map((n, i) => {
                const a = athleteBySlug(n.athlete);
                return (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                    <span className="text-bone">{NOTICE_TEXT[n.kind]}{n.text ? ` “${n.text}”` : ''} <span className="text-mute">{a ? fullName(a) : n.athlete}</span></span>
                    <span className="text-xs text-dim">{when(n.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="meet-h">
          <h2 id="meet-h" className="display text-4xl">Meet and greet</h2>
          {meets.length === 0 ? (
            <p className="mt-4 text-mute">No requests. Verified recruiters can ask for a call, a campus visit, or to say hello at a game. You accept or decline; they hear back either way.</p>
          ) : (
            <ul className="mt-4 grid gap-px overflow-hidden rounded border border-line bg-line">
              {meets.map((m) => {
                const a = athleteBySlug(m.athlete);
                return (
                  <li key={m.id} className="bg-ink p-4">
                    <p className="text-bone">{m.kind[0].toUpperCase() + m.kind.slice(1)} with {a ? fullName(a) : m.athlete}{m.when ? `, ${when(m.when)}` : ''}</p>
                    {m.message && <p className="mt-1 text-sm text-mute">{m.message}</p>}
                    {m.status === 'pending' ? (
                      <div className="mt-3 flex gap-2">
                        <button type="button" className="btn btn-primary" onClick={async () => { await answerMeet(m.id, 'accepted'); load(); }}><Check size={16} /> Accept</button>
                        <button type="button" className="btn btn-ghost" onClick={async () => { if (window.confirm('Decline this request? The recruiter is told it was declined, nothing more.')) { await answerMeet(m.id, 'declined'); load(); } }}><X size={16} /> Decline</button>
                      </div>
                    ) : (
                      <p className={`mt-2 text-sm ${m.status === 'accepted' ? 'text-ok' : 'text-dim'}`}>{m.status === 'accepted' ? 'Accepted' : 'Declined'}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {(v.role === 'coach' || film.length > 0) && (
          <section aria-labelledby="film-h">
            <h2 id="film-h" className="display text-4xl">Film requests</h2>
            {film.length === 0 ? (
              <p className="mt-4 text-mute">When a college coach asks for game film, it lands here. Paste a link and send; that is the whole job.</p>
            ) : (
              <ul className="mt-4 grid gap-px overflow-hidden rounded border border-line bg-line">
                {film.map((f) => (
                  <li key={f.id} className="bg-ink p-4">
                    <p className="text-bone">{f.sport.replace(/-/g, ' ')}: {f.games}{f.athlete ? ` (${athleteBySlug(f.athlete) ? fullName(athleteBySlug(f.athlete)!) : f.athlete})` : ''}</p>
                    {f.status === 'open' ? (
                      <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); await answerFilm(f.id, filmUrl[f.id]); load(); }}>
                        <label htmlFor={`fu-${f.id}`} className="sr-only">Film link</label>
                        <input id={`fu-${f.id}`} type="url" required className="field min-w-0 flex-1" placeholder="https://www.hudl.com/…" value={filmUrl[f.id] ?? ''} onChange={(e) => setFilmUrl({ ...filmUrl, [f.id]: e.target.value })} />
                        <button className="btn btn-primary">Send film</button>
                        <button type="button" className="btn btn-ghost" onClick={async () => { await answerFilm(f.id, null); load(); }}>Can’t share</button>
                      </form>
                    ) : (
                      <p className="mt-2 text-sm text-mute">{f.status === 'sent' ? <>Sent: <a className="link-u" href={f.filmUrl} target="_blank" rel="noreferrer">{f.filmUrl}</a></> : 'Declined'}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <aside className="grid content-start gap-10">
        <section aria-labelledby="prefs-h" className="rounded border border-line bg-ink-2 p-6">
          <h2 id="prefs-h" className="display text-3xl">Notify me by</h2>
          <div className="mt-4 grid gap-1">
            {(['email', 'push', 'sms'] as const).map((k) => (
              <label key={k} className="flex min-h-11 items-center gap-3 text-sm text-bone">
                <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={prefs[k]} onChange={(e) => updatePrefs({ ...prefs, [k]: e.target.checked })} />
                {k === 'sms' ? 'Text message' : k === 'push' ? 'Phone notifications' : 'Email'}
              </label>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-semibold text-mute">Tell me when</h3>
          <div className="mt-2 grid gap-1">
            {NOTICE_KINDS.map((n) => (
              <label key={n.kind} className="flex min-h-11 items-center gap-3 text-sm text-bone">
                <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={!prefs.muted.includes(n.kind)} onChange={(e) => updatePrefs({ ...prefs, muted: e.target.checked ? prefs.muted.filter((m) => m !== n.kind) : [...prefs.muted, n.kind] })} />
                {n.label}
              </label>
            ))}
          </div>
          <p className="mt-3 min-h-5 text-sm text-mute" role="status">{msg}</p>
        </section>

        {stars.length > 0 && (
          <section aria-labelledby="stars-h">
            <h2 id="stars-h" className="display text-3xl">Your starred athletes</h2>
            <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
              {stars.map((s) => {
                const a = athleteBySlug(s);
                return <li key={s} className="py-2"><Link className="link-u text-bone" href={`/athletes/${s}/`}>{a ? fullName(a) : s}</Link></li>;
              })}
            </ul>
          </section>
        )}
        <p className="text-sm text-mute">Parents and athletes: link to a profile, add a mailing address and send highlight tapes from the <Link className="link-u text-bone" href="/family/">family page</Link>.</p>
      </aside>
    </div>
  );
}
