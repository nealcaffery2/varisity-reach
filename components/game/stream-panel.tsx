'use client';

import { useEffect, useState } from 'react';
import { ArrowSquareOut, LinkSimple, SealCheck, VideoCamera } from '@phosphor-icons/react';
import type { Game } from '@/content/games';
import { detectPlatform, PLATFORM_NAME, playable, type Stream } from '@/lib/streams';
import { listStreams, pairStream } from '@/lib/backend';
import { asset } from '@/lib/asset';

/** Every stream paired with the game, one player at a time, plus a form to pair yours. */
export function StreamPanel({ game }: { game: Game }) {
  const [paired, setPaired] = useState<Stream[]>([]);
  const [active, setActive] = useState(0);
  const [host, setHost] = useState('localhost');
  const [url, setUrl] = useState('');
  const [by, setBy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const streams = [...game.streams, ...paired];
  const current = streams[active];

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost(window.location.hostname);
    listStreams(game.id).then(setPaired).catch(() => {});
  }, [game.id]);

  const pair = async (e: React.FormEvent) => {
    e.preventDefault();
    const platform = detectPlatform(url.trim());
    if (!platform) {
      setMsg({ ok: false, text: 'Paste a YouTube, Facebook, Twitch, Instagram or TikTok link.' });
      return;
    }
    const s: Stream = { platform, url: url.trim(), by: by.trim() || 'A fan in the stands' };
    try {
      await pairStream(game.id, s);
      setPaired((p) => [...p, s]);
      setActive(streams.length);
      setUrl('');
      setMsg({ ok: true, text: `${PLATFORM_NAME[platform]} paired. ${platform === 'instagram' || platform === 'tiktok' ? 'Viewers get a button to open it, since that app does not allow embedding live video. Add the overlay link to your stream to show the score on it.' : 'It plays here next to the score.'}` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not pair that stream.' });
    }
  };

  const p = current ? playable(current, host) : null;

  return (
    <section aria-labelledby="watch-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="watch-h" className="display text-3xl">Watch</h2>
        {streams.length > 1 && (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Streams">
            {streams.map((s, i) => (
              <button key={s.url + i} type="button" role="tab" aria-selected={i === active} className="chip" onClick={() => setActive(i)}>
                {PLATFORM_NAME[s.platform]} · {s.by.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-4 aspect-video overflow-hidden rounded border border-line bg-ink-2">
        {!p ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <VideoCamera size={36} className="text-dim" />
            <p className="mt-3 font-semibold text-bone">No stream paired yet</p>
            <p className="mt-1 max-w-sm text-sm text-mute">Going live from the stands? Paste your link below and everyone following this game can watch with the score.</p>
          </div>
        ) : p.kind === 'iframe' ? (
          <iframe src={p.src} title={p.title} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
        ) : p.kind === 'video' ? (
          <video src={asset(p.src)} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline controls aria-label={`Stream by ${current.by}`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="display text-3xl text-bone">{PLATFORM_NAME[current.platform]}</p>
            <p className="mt-2 max-w-sm text-sm text-mute">{current.by} is live there. That app does not let other sites play live video, so it opens in the app.</p>
            <a href={p.href} target="_blank" rel="noreferrer" className="btn btn-primary mt-5">{p.label} <ArrowSquareOut size={16} /></a>
          </div>
        )}
      </div>
      {current && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-mute">
          {current.verified && <SealCheck size={16} weight="fill" className="text-accent" />}
          {current.verified ? 'Verified stream' : 'Fan stream'} by {current.by}
          {game.sample && current.platform === 'file' && <span className="text-dim"> · sample clip</span>}
        </p>
      )}

      <form onSubmit={pair} className="mt-6 grid gap-3 rounded border border-line p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="pair-url" className="field-label">Pair your live stream</label>
          <input id="pair-url" type="url" inputMode="url" className="field" placeholder="https://www.instagram.com/yourname/live" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="pair-by" className="field-label">Your name</label>
          <input id="pair-by" className="field" placeholder="Shown to viewers" value={by} onChange={(e) => setBy(e.target.value)} autoComplete="name" />
        </div>
        <button type="submit" className="btn btn-primary"><LinkSimple size={18} /> Pair</button>
        {msg && <p className={`text-sm sm:col-span-3 ${msg.ok ? 'text-mute' : 'text-danger'}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
      </form>
    </section>
  );
}
