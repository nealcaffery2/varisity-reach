'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Camera, HandHeart, Newspaper, UsersThree } from '@phosphor-icons/react';
import { demoBoosters, demoGlory, demoSiblings, joinBoosters, postGloryDays, submitSiblings, type BoosterEntry, type Sibling } from '@/lib/community';

type Props = { school: string; town: string; short: string; sports: { slug: string; name: string }[]; paypal?: string };
const KIND_LABEL: Record<BoosterEntry['kind'], string> = { booster: 'Booster', alumni: 'Alumni', business: 'Local business', family: 'Family' };

export function BoosterWall({ school, town, short, sports, paypal }: Props) {
  const [list, setList] = useState<ReturnType<typeof demoBoosters>>([]);
  const [f, setF] = useState<BoosterEntry>({ school, name: '', anonymous: false, kind: 'booster', sports: [], shareContact: false });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(demoBoosters(school));
  }, [school]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="min-w-0">
        {list.length === 0 ? (
          <div className="rounded border border-dashed border-line-2 p-8">
            <p className="display text-4xl">Be the first name on the wall</p>
            <p className="mt-3 max-w-md text-mute">Everyone who backs {short} teams can list themselves here, by name, as alumni with a class year, as a business, or anonymously.</p>
          </div>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
            {list.map((b, i) => (
              <li key={i} className="bg-ink p-4">
                <p className="font-semibold text-bone">{b.anonymous ? 'Anonymous' : b.name}</p>
                <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-sm bg-accent px-1.5 font-semibold text-accent-ink">{KIND_LABEL[b.kind]}{b.kind === 'alumni' && b.classOf ? ` ’${String(b.classOf).slice(2)}` : ''}</span>
                  {b.sports.map((s) => <span key={s} className="rounded-sm border border-line-2 px-1.5 text-mute">{sports.find((x) => x.slug === s)?.name ?? s}</span>)}
                </p>
                {b.message && <p className="mt-2 text-sm text-mute">{b.message}</p>}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 grid gap-3 border-t border-line pt-6">
          <h2 className="font-semibold text-bone">Ways to give</h2>
          <p className="max-w-[30rem] text-sm text-mute">Card, Apple Pay and Google Pay through the school’s fundraisers (Stripe shows Apple Pay on iPhones and Safari automatically).{paypal ? ' PayPal goes straight to the booster club.' : ''} Gifts can pay for equipment, buses, camps, and ads that put {town} athletes in front of college coaches.</p>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={`/fundraise/?school=${school}`}><HandHeart size={18} /> Give to a fundraiser</Link>
            {paypal && <a className="btn btn-ghost" href={paypal} target="_blank" rel="noreferrer">PayPal</a>}
          </div>
        </div>
      </div>

      <form
        className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await joinBoosters(f);
          if (!r.ok) return setMsg(r.reason);
          setList(demoBoosters(school));
          setMsg(r.demo ? 'Added in this browser.' : `Welcome aboard. ${f.shareContact ? 'The athletic office can reach you to say thanks.' : ''}`);
          setF({ ...f, name: '', message: '' });
        }}
      >
        <h2 className="display text-3xl">Join the boosters</h2>
        <div>
          <label htmlFor="b-name" className="field-label">Name, family or business</label>
          <input id="b-name" required maxLength={80} className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="b-kind" className="field-label">I am</label>
            <select id="b-kind" className="field" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as BoosterEntry['kind'] })}>
              {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          {f.kind === 'alumni' && (
            <div>
              <label htmlFor="b-class" className="field-label">Class of</label>
              <input id="b-class" inputMode="numeric" maxLength={4} className="field" value={f.classOf ?? ''} onChange={(e) => setF({ ...f, classOf: Number(e.target.value) || undefined })} />
            </div>
          )}
        </div>
        <fieldset>
          <legend className="field-label">Teams you back</legend>
          <div className="flex flex-wrap gap-2">
            {sports.map((s) => (
              <button key={s.slug} type="button" className="chip" aria-pressed={f.sports.includes(s.slug)} onClick={() => setF({ ...f, sports: f.sports.includes(s.slug) ? f.sports.filter((x) => x !== s.slug) : [...f.sports, s.slug] })}>{s.name}</button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="b-msg" className="field-label">A line for the wall (optional)</label>
          <input id="b-msg" maxLength={280} className="field" value={f.message ?? ''} onChange={(e) => setF({ ...f, message: e.target.value })} />
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm text-bone"><input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={f.anonymous} onChange={(e) => setF({ ...f, anonymous: e.target.checked })} /> List me as anonymous</label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-bone"><input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={f.shareContact} onChange={(e) => setF({ ...f, shareContact: e.target.checked })} /> The athletic office may contact me</label>
        {f.shareContact && (
          <div className="grid gap-3">
            <div><label htmlFor="b-email" className="field-label">Email</label><input id="b-email" type="email" autoComplete="email" className="field" value={f.email ?? ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><label htmlFor="b-phone" className="field-label">Phone</label><input id="b-phone" type="tel" autoComplete="tel" className="field" value={f.phone ?? ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          </div>
        )}
        <button className="btn btn-primary">Join</button>
        <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>
      </form>
    </div>
  );
}

export function GloryDays({ school, short, sports }: Omit<Props, 'paypal' | 'town'>) {
  const [posts, setPosts] = useState<ReturnType<typeof demoGlory>>([]);
  const [f, setF] = useState({ author: '', tag: 'alumni' as 'alumni' | 'booster' | 'family', classOf: '', sport: '', title: '', story: '', articleUrl: '' });
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosts(demoGlory(school));
  }, [school]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="min-w-0">
        {posts.length === 0 ? (
          <div className="rounded border border-dashed border-line-2 p-8">
            <p className="display text-4xl">Dig out the scrapbook</p>
            <p className="mt-3 max-w-md text-mute">The 1987 sectional, the night the lights went out, the clipping your mom laminated. Post it with a photo and the story; the athletic office approves it before it goes up.</p>
          </div>
        ) : (
          <ul className="grid gap-6">
            {posts.map((p, i) => (
              <li key={i} className="rounded border border-line p-5">
                <p className="text-sm text-accent">{p.sport ? `${sports.find((s) => s.slug === p.sport)?.name ?? p.sport} · ` : ''}{p.classOf ? `Class of ${p.classOf}` : ''}</p>
                <h3 className="display mt-1 text-4xl">{p.title}</h3>
                <p className="mt-2 text-xs"><span className="rounded-sm bg-accent px-1.5 font-semibold text-accent-ink">{p.tag === 'alumni' ? 'Alumni' : p.tag === 'booster' ? 'Booster' : 'Family'}</span> <span className="text-mute">{p.author}</span></p>
                <p className="mt-3 whitespace-pre-line text-mute">{p.story}</p>
                {p.photos.length > 0 && <p className="mt-3 flex items-center gap-1 text-sm text-dim"><Camera size={14} aria-hidden /> {p.photos.length} photo{p.photos.length > 1 ? 's' : ''} waiting for approval</p>}
                {p.articleUrl && <a className="link-u mt-2 inline-flex items-center gap-1 text-sm text-bone" href={p.articleUrl} target="_blank" rel="noreferrer"><Newspaper size={14} aria-hidden /> The article</a>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form
        className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await postGloryDays({ school, author: f.author, tag: f.tag, classOf: Number(f.classOf) || undefined, sport: f.sport || undefined, title: f.title, story: f.story, articleUrl: f.articleUrl || undefined, photos: files });
          if (!r.ok) return setMsg(r.reason);
          setPosts(demoGlory(school));
          setFiles([]);
          setF({ ...f, title: '', story: '', articleUrl: '' });
          setMsg('Sent to the athletic office for approval.');
        }}
      >
        <h3 className="display text-3xl">Tell a {short} story</h3>
        <div><label htmlFor="g-author" className="field-label">Your name</label><input id="g-author" required className="field" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="g-tag" className="field-label">Posting as</label>
            <select id="g-tag" className="field" value={f.tag} onChange={(e) => setF({ ...f, tag: e.target.value as typeof f.tag })}>
              <option value="alumni">Alumni</option><option value="booster">Booster</option><option value="family">Family</option>
            </select>
          </div>
          <div><label htmlFor="g-class" className="field-label">Class of</label><input id="g-class" inputMode="numeric" maxLength={4} className="field" value={f.classOf} onChange={(e) => setF({ ...f, classOf: e.target.value })} /></div>
        </div>
        <div>
          <label htmlFor="g-sport" className="field-label">Sport</label>
          <select id="g-sport" className="field" value={f.sport} onChange={(e) => setF({ ...f, sport: e.target.value })}><option value="">Any</option>{sports.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select>
        </div>
        <div><label htmlFor="g-title" className="field-label">Headline</label><input id="g-title" required maxLength={120} className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label htmlFor="g-story" className="field-label">The story</label><textarea id="g-story" required maxLength={4000} className="field min-h-32" value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} /></div>
        <div><label htmlFor="g-photos" className="field-label">Old photos (up to 6)</label><input id="g-photos" type="file" multiple accept="image/*" className="field file:mr-3 file:rounded-sm file:border-0 file:bg-ink-3 file:px-3 file:py-1 file:text-bone" onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 6))} /></div>
        <div><label htmlFor="g-url" className="field-label">Link to a news article (optional)</label><input id="g-url" type="url" className="field" value={f.articleUrl} onChange={(e) => setF({ ...f, articleUrl: e.target.value })} /></div>
        <button className="btn btn-primary">Send for approval</button>
        <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>
      </form>
    </div>
  );
}

const blank = (): Sibling => ({ name: '', classOf: undefined, sports: '', highlight: '' });

export function SiblingSuperstars({ school, short }: { school: string; short: string }) {
  const [sets, setSets] = useState<ReturnType<typeof demoSiblings>>([]);
  const [family, setFamily] = useState('');
  const [members, setMembers] = useState<Sibling[]>([blank(), blank()]);
  const [story, setStory] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSets(demoSiblings(school));
  }, [school]);
  const edit = (i: number, k: keyof Sibling, v: string) => setMembers(members.map((m, j) => (j === i ? { ...m, [k]: k === 'classOf' ? Number(v) || undefined : v } : m)));

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
      <div className="min-w-0">
        {sets.length === 0 ? (
          <div className="rounded border border-dashed border-line-2 p-8">
            <p className="display text-4xl">Big brother set the record. Little sister broke it.</p>
            <p className="mt-3 max-w-md text-mute">Families who sent kid after kid through {short} sports, side by side across the years.</p>
          </div>
        ) : (
          <ul className="grid gap-6">
            {sets.map((s, i) => (
              <li key={i} className="border-t border-line pt-6">
                <h3 className="display flex items-center gap-3 text-4xl"><UsersThree size={28} className="text-accent" aria-hidden /> The {s.familyName} family</h3>
                <ol className="mt-4 grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2">
                  {[...s.members].sort((a, b) => (a.classOf ?? 0) - (b.classOf ?? 0)).map((m, j) => (
                    <li key={j} className="bg-ink p-4">
                      <p className="font-semibold text-bone">{m.name}{m.classOf ? <span className="num ml-2 text-sm text-accent">’{String(m.classOf).slice(2)}</span> : null}</p>
                      <p className="text-sm text-dim">{m.sports}</p>
                      <p className="mt-1 text-sm text-mute">{m.highlight}</p>
                    </li>
                  ))}
                </ol>
                {s.story && <p className="mt-3 text-mute">{s.story}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form
        className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await submitSiblings({ school, familyName: family, members: members.filter((m) => m.name.trim()), story: story || undefined });
          if (!r.ok) return setMsg(r.reason);
          setSets(demoSiblings(school));
          setFamily('');
          setMembers([blank(), blank()]);
          setStory('');
          setMsg('Sent to the athletic office for approval.');
        }}
      >
        <h3 className="display text-3xl">Add your family</h3>
        <div><label htmlFor="s-fam" className="field-label">Family name</label><input id="s-fam" required className="field" value={family} onChange={(e) => setFamily(e.target.value)} /></div>
        {members.map((m, i) => (
          <fieldset key={i} className="grid gap-2 border-t border-line pt-3">
            <legend className="px-1 text-sm text-mute">Sibling {i + 1}</legend>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <div><label htmlFor={`s-n-${i}`} className="field-label">Name</label><input id={`s-n-${i}`} className="field" value={m.name} onChange={(e) => edit(i, 'name', e.target.value)} /></div>
              <div><label htmlFor={`s-c-${i}`} className="field-label">Class</label><input id={`s-c-${i}`} inputMode="numeric" maxLength={4} className="field" value={m.classOf ?? ''} onChange={(e) => edit(i, 'classOf', e.target.value)} /></div>
            </div>
            <div><label htmlFor={`s-s-${i}`} className="field-label">Sports</label><input id={`s-s-${i}`} className="field" value={m.sports} onChange={(e) => edit(i, 'sports', e.target.value)} /></div>
            <div><label htmlFor={`s-h-${i}`} className="field-label">Best moment</label><input id={`s-h-${i}`} maxLength={200} className="field" value={m.highlight} onChange={(e) => edit(i, 'highlight', e.target.value)} /></div>
          </fieldset>
        ))}
        {members.length < 8 && <button type="button" className="btn btn-ghost" onClick={() => setMembers([...members, blank()])}>Add another sibling</button>}
        <div><label htmlFor="s-story" className="field-label">The family story (optional)</label><textarea id="s-story" maxLength={2000} className="field min-h-24" value={story} onChange={(e) => setStory(e.target.value)} /></div>
        <button className="btn btn-primary">Send for approval</button>
        <p className="min-h-5 text-sm text-mute" role="status">{msg}</p>
      </form>
    </div>
  );
}
