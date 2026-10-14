'use client';

import { useEffect, useState } from 'react';
import { ArrowFatUp, Copy, FacebookLogo, HandCoins, XLogo, Plus } from '@phosphor-icons/react';
import { listPledges, listWants, myWantVotes, pledgeWant, suggestWant, voteWant, type Want, type WantPledge } from '@/lib/community';
import { pledgeProgress } from '@/lib/media';

type Props = { school: string; town: string; short: string; sports: { slug: string; name: string }[]; starters: Want[] };

/** What families and athletes want for the school, by vote. Staff mark items funded or done. */
export function WantsBoard({ school, town, short, sports, starters }: Props) {
  const [wants, setWants] = useState<Want[]>(starters);
  const [mine, setMine] = useState<string[]>([]);
  const [sport, setSport] = useState('');
  const [draft, setDraft] = useState({ title: '', sport: '', detail: '' });
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState('');
  const [pledges, setPledges] = useState<WantPledge[]>([]);
  const [pledging, setPledging] = useState('');
  const [pf, setPf] = useState<{ by: WantPledge['by']; name: string; dollars: string; hours: string }>({ by: 'faculty', name: '', dollars: '', hours: '' });

  const load = () =>
    listWants(school, starters).then((w) => {
      setWants([...w].sort((a, b) => b.votes - a.votes));
      listPledges(school, w.map((x) => x.id)).then(setPledges);
    });
  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMine(myWantVotes(school));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school]);

  const vote = async (w: Want) => {
    const on = !mine.includes(w.id);
    const r = await voteWant(school, w.id, on);
    if (!r.ok) return setMsg(r.reason);
    setMine(myWantVotes(school));
    load();
  };

  const shareText = (w: Want) => `${town} families are voting on what ${short} needs. Top of the list: ${w.title} (${w.votes} vote${w.votes === 1 ? '' : 's'}). Add your vote:`;
  const pageUrl = () => window.location.href.split('#')[0];
  const copy = async (w: Want) => {
    const text = `${shareText(w)} ${pageUrl()}`;
    if (navigator.share) return navigator.share({ text, url: pageUrl() }).catch(() => {});
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(w.id);
    setTimeout(() => setCopied(''), 1800);
  };

  const shown = wants.filter((w) => !sport || w.sport === sport || (sport === 'school' && !w.sport));
  const sportName = (s?: string) => (s ? sports.find((x) => x.slug === s)?.name ?? s : 'Whole school');

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="w-sport" className="field-label">Show</label>
            <select id="w-sport" className="field w-auto" value={sport} onChange={(e) => setSport(e.target.value)}>
              <option value="">Everything</option>
              <option value="school">Whole school</option>
              {sports.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </select>
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="mt-6 text-mute">Nothing on the list for this team yet. Suggest the first one.</p>
        ) : (
          <ol className="mt-6 grid gap-px overflow-hidden rounded border border-line bg-line">
            {shown.map((w) => {
              const on = mine.includes(w.id);
              return (
                <li key={w.id} className="grid grid-cols-[auto_1fr] gap-4 bg-ink p-4">
                  <button type="button" onClick={() => vote(w)} aria-pressed={on} aria-label={`${on ? 'Remove your vote for' : 'Vote for'} ${w.title}`} className={`flex w-14 flex-col items-center justify-center rounded-sm border py-2 transition-colors ${on ? 'border-accent bg-accent/10 text-accent' : 'border-line-2 text-mute hover:border-dim hover:text-bone'}`}>
                    <ArrowFatUp size={20} weight={on ? 'fill' : 'regular'} />
                    <span className="num text-sm">{w.votes}</span>
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-bone">{w.title}</p>
                    <p className="text-sm text-dim">{sportName(w.sport)}{w.estCents ? ` · about $${Math.round(w.estCents / 100).toLocaleString()}` : ''}{w.status !== 'open' ? ` · ${w.status}` : ''}</p>
                    {w.detail && <p className="mt-1 text-sm text-mute">{w.detail}</p>}
                    {(() => {
                      const mine = pledges.filter((p) => p.wantId === w.id);
                      if (!mine.length) return null;
                      const pr = pledgeProgress(w.estCents, mine);
                      return (
                        <p className="mt-2 text-sm text-bone">
                          <HandCoins size={14} className="inline text-accent" aria-hidden /> Pledged{pr.cents ? ` $${Math.round(pr.cents / 100).toLocaleString()}` : ''}{pr.hours ? `${pr.cents ? ' and' : ''} ${pr.hours} volunteer hours` : ''}{pr.pct !== undefined ? ` (${pr.pct}% of the cost)` : ''}
                          {pr.faculty && <span className="ml-2 rounded-sm bg-accent px-1.5 text-xs font-semibold text-accent-ink">Faculty pledged</span>}
                        </p>
                      );
                    })()}
                    {pledging === w.id ? (
                      <form
                        className="mt-3 grid gap-2 rounded-sm bg-ink-2 p-3 sm:grid-cols-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const r = await pledgeWant(school, { wantId: w.id, by: pf.by, name: pf.name, cents: pf.dollars ? Math.round(Number(pf.dollars) * 100) : undefined, hours: pf.hours ? Number(pf.hours) : undefined });
                          setMsg(r.ok ? 'Pledge recorded. The athletic office sees who stepped up.' : r.reason);
                          if (r.ok) { setPledging(''); load(); }
                        }}
                      >
                        <div><label htmlFor={`pl-by-${w.id}`} className="field-label">Pledging as</label><select id={`pl-by-${w.id}`} className="field" value={pf.by} onChange={(e) => setPf({ ...pf, by: e.target.value as WantPledge['by'] })}><option value="faculty">Faculty or staff</option><option value="booster">Booster</option><option value="sponsor">Local business</option><option value="family">Family</option></select></div>
                        <div><label htmlFor={`pl-n-${w.id}`} className="field-label">Name</label><input id={`pl-n-${w.id}`} required className="field" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} /></div>
                        <div><label htmlFor={`pl-d-${w.id}`} className="field-label">Dollars</label><input id={`pl-d-${w.id}`} inputMode="numeric" className="field num" value={pf.dollars} onChange={(e) => setPf({ ...pf, dollars: e.target.value.replace(/\D/g, '') })} /></div>
                        <div><label htmlFor={`pl-h-${w.id}`} className="field-label">Volunteer hours</label><input id={`pl-h-${w.id}`} inputMode="numeric" className="field num" value={pf.hours} onChange={(e) => setPf({ ...pf, hours: e.target.value.replace(/\D/g, '') })} /></div>
                        <div className="flex gap-2 sm:col-span-2"><button className="btn btn-primary">Pledge</button><button type="button" className="btn btn-ghost" onClick={() => setPledging('')}>Cancel</button></div>
                      </form>
                    ) : (
                      <button type="button" className="link-u mt-2 inline-flex min-h-8 items-center gap-1 text-sm text-mute hover:text-bone" onClick={() => setPledging(w.id)}><HandCoins size={14} aria-hidden /> Pledge money or hours</button>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-dim">
                      <a className="link-u inline-flex min-h-8 items-center gap-1 hover:text-bone" target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window === 'undefined' ? '' : pageUrl())}&quote=${encodeURIComponent(shareText(w))}`}><FacebookLogo size={14} aria-hidden /> Facebook</a>
                      <a className="link-u inline-flex min-h-8 items-center gap-1 hover:text-bone" target="_blank" rel="noreferrer" href={`https://x.com/intent/post?text=${encodeURIComponent(shareText(w))}&url=${encodeURIComponent(typeof window === 'undefined' ? '' : pageUrl())}`}><XLogo size={14} aria-hidden /> X</a>
                      <button type="button" className="link-u inline-flex min-h-8 items-center gap-1 hover:text-bone" onClick={() => copy(w)}><Copy size={14} aria-hidden /> {copied === w.id ? 'Copied' : 'Instagram or TikTok caption'}</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-3 min-h-5 text-sm text-mute" role="status">{msg}</p>
      </div>

      <form
        className="grid content-start gap-3 rounded border border-line bg-ink-2 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await suggestWant({ school, sport: draft.sport || undefined, title: draft.title.trim(), detail: draft.detail.trim() || undefined });
          if (!r.ok) return setMsg(r.reason);
          setDraft({ title: '', sport: '', detail: '' });
          setMsg(r.demo ? 'Added in this browser.' : 'Added. Staff can mark it funded or done.');
          load();
        }}
      >
        <h2 className="display text-3xl">Suggest something</h2>
        <div>
          <label htmlFor="w-title" className="field-label">What the school needs</label>
          <input id="w-title" required maxLength={120} className="field" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Two-man blocking sled" />
        </div>
        <div>
          <label htmlFor="w-for" className="field-label">For</label>
          <select id="w-for" className="field" value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value })}>
            <option value="">Whole school</option>
            {sports.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="w-detail" className="field-label">Why (optional)</label>
          <textarea id="w-detail" maxLength={500} className="field min-h-24" value={draft.detail} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} />
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add to the list</button>
        <p className="text-xs text-dim">One vote per person per item. The athletic director sees the totals and can turn the top item into a fundraiser.</p>
      </form>
    </div>
  );
}
