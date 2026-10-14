'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, EnvelopeSimple, FacebookLogo, LinkSimple, Printer, QrCode, ShareNetwork, XLogo } from '@phosphor-icons/react';
import QRCode from 'qrcode';

/** Share a profile everywhere a recruit or parent would: native sheet, link, socials, QR for a showcase table, print. */
export function ShareBar({ title, text }: { title: string; text: string }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Browser-only state (URL, storage, APIs) is read after hydration so the static HTML matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(window.location.href.split('#')[0]);
    setCanShare(typeof navigator.share === 'function');
  }, []);
  useEffect(() => {
    if (qr && canvas.current && url) QRCode.toCanvas(canvas.current, url, { width: 176, margin: 1, color: { dark: '#0c0c0d', light: '#f3f1ee' } }).catch(() => {});
  }, [qr, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', url);
    }
  };
  const enc = encodeURIComponent;
  const icon = 'inline-flex h-11 w-11 items-center justify-center rounded border border-line-2 text-mute transition-colors hover:border-bone hover:text-bone';

  return (
    <div className="no-print relative flex flex-wrap items-center gap-2">
      {canShare && (
        <button type="button" className="btn btn-primary" onClick={() => navigator.share({ title, text, url }).catch(() => {})}>
          <ShareNetwork size={18} /> Share
        </button>
      )}
      <button type="button" className={canShare ? 'btn btn-ghost' : 'btn btn-primary'} onClick={copy}>
        {copied ? <><Check size={18} /> Copied</> : <><LinkSimple size={18} /> Copy link</>}
      </button>
      <a className={icon} aria-label="Post on X" href={`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`} target="_blank" rel="noreferrer"><XLogo size={18} /></a>
      <a className={icon} aria-label="Share on Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noreferrer"><FacebookLogo size={18} /></a>
      <a className={icon} aria-label="Send by email" href={`mailto:?subject=${enc(title)}&body=${enc(`${text}\n\n${url}`)}`}><EnvelopeSimple size={18} /></a>
      <button type="button" className={icon} aria-label="Show QR code" aria-expanded={qr} onClick={() => setQr((q) => !q)}><QrCode size={18} /></button>
      <button type="button" className={icon} aria-label="Print one-page profile" onClick={() => window.print()}><Printer size={18} /></button>
      <AnimatePresence>
        {qr && (
          <motion.div
            className="absolute left-0 top-full z-20 mt-2 rounded border border-line bg-bone p-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <canvas ref={canvas} width={176} height={176} aria-label="QR code linking to this profile" role="img" />
            <p className="mt-2 text-center text-xs text-ink">Scan to open this profile</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
