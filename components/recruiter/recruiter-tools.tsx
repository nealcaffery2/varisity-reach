'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EnvelopeSimple, FilmSlate, Handshake, MapPin, Star } from '@phosphor-icons/react';
import { contactAthlete, logRecruiterView, myStars, requestFilm, requestMeet, revealAddress, toggleStar, viewer, type MeetRequest, type Viewer } from '@/lib/community';
import { canContact, type Division } from '@/lib/recruiting-rules';

type Props = { slug: string; school: string; coach: string; name: string; gradYear: number; sport: string; sample: boolean };
const DIVISIONS: Division[] = ['D1', 'D2', 'D3', 'NAIA', 'JUCO'];

/** Star, write and mail. Verified college coaches only; everyone else sees how to get verified. */
export function RecruiterTools({ slug, school, coach, name, gradYear, sport, sample }: Props) {
  const [v, setV] = useState<Viewer | null>(null);
  const [starred, setStarred] = useState(false);
  const [open, setOpen] = useState<'' | 'write' | 'meet' | 'film'>('');
  const [meetKind, setMeetKind] = useState<MeetRequest['kind']>('video call');
  const [when, setWhen] = useState('');
  const [games, setGames] = useState('');
  const [channel, setChannel] = useState<'email' | 'mail'>('email');
  const [division, setDivision] = useState<Division>('D2');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    viewer().then((x) => {
      setV(x);
      if (x.role === 'recruiter' && x.verified) logRecruiterView(slug, school);
    });
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStarred(myStars().includes(slug));
  }, [slug, school]);

  if (!v) return <div className="mt-5 h-11 animate-pulse rounded bg-ink-3" aria-hidden />;
  const recruiter = v.role === 'recruiter' && v.verified;

  if (!recruiter) {
    return (
      <p className="mt-5 text-sm text-mute">
        College coaches: <Link href="/join/?role=recruiter" className="link-u text-bone">get verified</Link> to star {name.split(' ')[0]}, write through Varsity Reach, or request a mailing address. The family is told who starred and who wrote.
      </p>
    );
  }

  const check = canContact({ division, sport, gradYear, now: new Date(), minor: true });

  const star = async () => {
    const r = await toggleStar(slug);
    if (r.ok) {
      setStarred(Boolean(r.starred));
      setMsg(r.starred ? `Starred. ${name.split(' ')[0]} and their family get a notice with your name and school.` : 'Star removed.');
    } else setMsg(r.reason);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await contactAthlete({ athlete: slug, channel, subject, body, division, sport });
    setBusy(false);
    if (!r.ok) return setMsg(r.reason);
    setOpen('');
    setSubject('');
    setBody('');
    setMsg(r.held ? `Held until ${r.held}, when the NCAA calendar allows it.` : r.demo ? 'Sample send: saved in this browser, and the family’s notice list shows it.' : channel === 'mail' ? 'Queued for printing and mailing. The family gets a copy.' : 'Sent, with a copy to a parent.');
  };

  const meet = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await requestMeet({ athlete: slug, kind: meetKind, when: when || undefined, message: body || undefined });
    setBusy(false);
    if (!r.ok) return setMsg(r.reason);
    setOpen('');
    setMsg(`Asked. ${name.split(' ')[0]} and their family can accept or decline, and you get a notice either way.`);
  };

  const film = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await requestFilm({ school, athlete: slug, sport, games: games || 'Any full game this season' });
    setBusy(false);
    if (!r.ok) return setMsg(r.reason);
    setOpen('');
    setGames('');
    setMsg(`Sent to ${coach}. They answer with one button and a film link.`);
  };

  const reveal = async () => {
    const r = await revealAddress(slug);
    if (!r.ok) return setMsg(r.reason);
    const a = r.address;
    setAddress(`${a.nameOnMail}, ${a.street}, ${a.city}, ${a.state} ${a.zip}`);
  };

  return (
    <div className="mt-5 grid gap-3">
      {sample && <p className="text-xs text-dim">Sample profile: these buttons work in this browser only.</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={star} aria-pressed={starred} className={`btn ${starred ? 'btn-primary' : 'btn-ghost'}`}>
          <Star size={18} weight={starred ? 'fill' : 'regular'} /> {starred ? 'Starred' : 'Star'}
        </button>
        <button type="button" onClick={() => setOpen(open ? '' : 'write')} aria-expanded={open === 'write'} className="btn btn-ghost">
          <EnvelopeSimple size={18} /> Write
        </button>
      </div>
      {open === 'write' && (
        <form onSubmit={send} className="grid gap-3 rounded border border-line bg-ink p-4">
          <fieldset>
            <legend className="field-label">Send as</legend>
            <div className="flex gap-2">
              {(['email', 'mail'] as const).map((c) => (
                <button key={c} type="button" className="chip" aria-pressed={channel === c} onClick={() => setChannel(c)}>{c === 'email' ? 'Email' : 'Printed letter'}</button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="rc-div" className="field-label">Your division</label>
            <select id="rc-div" className="field" value={division} onChange={(e) => setDivision(e.target.value as Division)}>
              {DIVISIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          {!check.ok && <p className="text-sm text-danger">{check.reason} You can write it now; we hold it until then.</p>}
          <div>
            <label htmlFor="rc-sub" className="field-label">Subject</label>
            <input id="rc-sub" className="field" required maxLength={140} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rc-body" className="field-label">Message</label>
            <textarea id="rc-body" className="field min-h-32" required maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <p className="text-xs text-dim">A linked parent gets a copy of every message. Letters print and mail from us to the address the family shared, so you never see it unless they allow it.</p>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : channel === 'mail' ? 'Mail letter' : 'Send email'}</button>
        </form>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(open === 'meet' ? '' : 'meet')} aria-expanded={open === 'meet'} className="btn btn-ghost"><Handshake size={18} /> Meet</button>
        <button type="button" onClick={() => setOpen(open === 'film' ? '' : 'film')} aria-expanded={open === 'film'} className="btn btn-ghost"><FilmSlate size={18} /> Film</button>
      </div>
      {open === 'meet' && (
        <form onSubmit={meet} className="grid gap-3 rounded border border-line bg-ink p-4">
          <div>
            <label htmlFor="mt-kind" className="field-label">How</label>
            <select id="mt-kind" className="field" value={meetKind} onChange={(e) => setMeetKind(e.target.value as MeetRequest['kind'])}>
              {(['video call', 'phone call', 'campus visit', 'at a game'] as const).map((k) => <option key={k} value={k}>{k[0].toUpperCase() + k.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="mt-when" className="field-label">When (optional)</label>
            <input id="mt-when" type="datetime-local" className="field" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label htmlFor="mt-msg" className="field-label">Note to the family</label>
            <textarea id="mt-msg" className="field min-h-24" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Ask to meet'}</button>
        </form>
      )}
      {open === 'film' && (
        <form onSubmit={film} className="grid gap-3 rounded border border-line bg-ink p-4">
          <p className="text-sm text-mute">Goes to {coach}, the head coach, with your verified name and program.</p>
          <div>
            <label htmlFor="fm-games" className="field-label">Which games</label>
            <input id="fm-games" className="field" maxLength={300} value={games} onChange={(e) => setGames(e.target.value)} placeholder="Week 8, or any full game" />
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Request film'}</button>
        </form>
      )}
      <button type="button" onClick={reveal} className="btn btn-ghost"><MapPin size={18} /> Mailing address</button>
      {address && <p className="rounded border border-line p-3 text-sm text-bone">{address}<span className="mt-1 block text-xs text-dim">Logged. The family sees that you looked.</span></p>}
      <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>
    </div>
  );
}
