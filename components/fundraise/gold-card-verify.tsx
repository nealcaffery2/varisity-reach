'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { verifyGoldCard } from '@/lib/backend';
import { goldCardFor } from '@/content/fundraising';
import { schoolBySlug } from '@/content/schools';
import type { VerifyResult } from '@/lib/gold-card';

/** What a merchant sees after scanning: a huge yes or no. */
export function GoldCardVerify() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (t: string) => {
    if (!t.trim()) return;
    setBusy(true);
    setResult(await verifyGoldCard(t.trim()));
    setBusy(false);
  };

  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get('t');
    if (t) {
      // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(t);
      check(t);
    }
  }, []);

  const ok = result?.ok ? result : null;
  const school = ok ? schoolBySlug(ok.payload.school) : undefined;
  const perks = ok ? goldCardFor(ok.payload.school)?.perks ?? [] : [];

  return (
    <div className="mx-auto max-w-xl">
      {result && (
        <div className={`rounded-lg border-2 p-8 text-center ${ok && !ok.demo ? 'border-ok' : 'border-danger'}`} role="status">
          {ok && !ok.demo ? <CheckCircle size={72} weight="fill" className="mx-auto text-ok" /> : <XCircle size={72} weight="fill" className="mx-auto text-danger" />}
          <p className="display mt-4 text-6xl">{ok ? (ok.demo ? 'Demo card' : 'Valid') : 'Not valid'}</p>
          {ok ? (
            <>
              <p className="mt-3 text-xl text-bone">{ok.payload.holder}</p>
              <p className="text-mute">{school?.name} · {ok.payload.season} · good through {ok.payload.exp}</p>
              {ok.demo && <p className="mt-3 text-sm text-danger">This card was made in demo mode. Do not honor it.</p>}
            </>
          ) : (
            <p className="mt-3 text-bone">{result.ok ? '' : result.reason}</p>
          )}
        </div>
      )}
      {ok && !ok.demo && perks.length > 0 && (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {perks.map((p) => <li key={p.merchant} className="flex justify-between gap-4 py-3"><span className="text-bone">{p.merchant}</span><span className="text-right text-mute">{p.offer}</span></li>)}
        </ul>
      )}
      <form className="mt-8" onSubmit={(e) => { e.preventDefault(); check(token); }}>
        <label htmlFor="gc-token" className="field-label">Card code</label>
        <div className="flex gap-2">
          <input id="gc-token" className="field num text-xs" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Scan the QR, or paste the code" />
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Check'}</button>
        </div>
      </form>
    </div>
  );
}
