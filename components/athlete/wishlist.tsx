'use client';

import { useEffect, useState } from 'react';
import { ArrowSquareOut, Plus, Trash } from '@phosphor-icons/react';
import { demoLinks, demoWishlist, saveWishlist, viewer, type WishItem } from '@/lib/community';

const KINDS: { kind: WishItem['kind']; label: string; hint: string }[] = [
  { kind: 'school', label: 'Dream schools', hint: 'A college you would love to play for' },
  { kind: 'gear', label: 'Dream gear', hint: 'Cleats, a helmet, a bat' },
  { kind: 'athlete', label: 'Athletes to meet', hint: 'Someone you look up to' },
];

/** Search links, not a store integration: none of these retailers offer a public product API. */
export const RETAILERS = [
  { name: 'Dick’s', url: (q: string) => `https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm=${encodeURIComponent(q)}` },
  { name: 'Academy', url: (q: string) => `https://www.academy.com/search?searchTerm=${encodeURIComponent(q)}` },
  { name: 'Nike', url: (q: string) => `https://www.nike.com/w?q=${encodeURIComponent(q)}` },
  { name: 'Under Armour', url: (q: string) => `https://www.underarmour.com/en-us/search/?q=${encodeURIComponent(q)}` },
  { name: 'Schutt', url: (q: string) => `https://www.schuttsports.com/search?q=${encodeURIComponent(q)}` },
];

export function Wishlist({ slug, first }: { slug: string; first: string }) {
  const [items, setItems] = useState<WishItem[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [draft, setDraft] = useState<{ kind: WishItem['kind']; title: string; url: string }>({ kind: 'school', title: '', url: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(demoWishlist(slug));
    viewer().then((v) => setCanEdit((v.demo ? demoLinks().some((l) => l.athlete === slug) : false) || ((v.role === 'athlete' || v.role === 'parent') && !v.demo)));
  }, [slug]);

  const persist = async (next: WishItem[]) => {
    setItems(next);
    const r = await saveWishlist(slug, next);
    setMsg(r.ok ? (r.demo ? 'Saved in this browser.' : 'Saved.') : r.reason);
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    persist([...items, { id: crypto.randomUUID(), kind: draft.kind, title: draft.title.trim(), url: draft.url.trim() || undefined }]);
    setDraft({ ...draft, title: '', url: '' });
  };

  if (!items.length && !canEdit) return null;

  return (
    <section className="no-print rounded border border-line p-6" aria-labelledby="wish-h">
      <h2 id="wish-h" className="display text-3xl">{first}’s wishlist</h2>
      {KINDS.map(({ kind, label }) => {
        const list = items.filter((i) => i.kind === kind);
        if (!list.length) return null;
        return (
          <div key={kind} className="mt-4">
            <h3 className="text-sm font-semibold text-mute">{label}</h3>
            <ul className="mt-2 divide-y divide-line text-sm">
              {list.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-bone">{i.url ? <a className="link-u" href={i.url} target="_blank" rel="noreferrer">{i.title}</a> : i.title}</p>
                    {kind === 'gear' && (
                      <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-dim">
                        {RETAILERS.map((r) => <a key={r.name} className="link-u inline-flex items-center gap-1 hover:text-bone" href={r.url(i.title)} target="_blank" rel="noreferrer">{r.name}<ArrowSquareOut size={10} aria-hidden /></a>)}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <button type="button" aria-label={`Remove ${i.title}`} className="grid size-11 shrink-0 place-items-center rounded-sm text-dim hover:bg-ink-3 hover:text-danger" onClick={() => persist(items.filter((x) => x.id !== i.id))}>
                      <Trash size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {canEdit && (
        <form onSubmit={add} className="mt-5 grid gap-3 border-t border-line pt-5">
          <div>
            <label htmlFor="wish-kind" className="field-label">Add to</label>
            <select id="wish-kind" className="field" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as WishItem['kind'] })}>
              {KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="wish-title" className="field-label">{KINDS.find((k) => k.kind === draft.kind)!.hint}</label>
            <input id="wish-title" className="field" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <label htmlFor="wish-url" className="field-label">Link (optional)</label>
            <input id="wish-url" type="url" className="field" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          </div>
          <button className="btn btn-ghost"><Plus size={16} /> Add</button>
        </form>
      )}
      <p className="mt-4 text-xs text-dim">Gear on this list is for family and friends. Boosters and businesses give through the school’s team fund, not to an athlete directly, so nobody’s eligibility is put at risk.</p>
      <p className="mt-2 min-h-4 text-xs text-mute" role="status">{msg}</p>
    </section>
  );
}
