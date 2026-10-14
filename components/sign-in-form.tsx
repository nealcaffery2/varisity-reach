'use client';

import { useState } from 'react';
import { EnvelopeSimple } from '@phosphor-icons/react';
import { sendSignInLink } from '@/lib/backend';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'demo'>('idle');
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter the email you want the link sent to.');
    setError('');
    setState('busy');
    try {
      const r = await sendSignInLink(email.trim());
      setState(r.demo ? 'demo' : 'sent');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'The link did not send.');
    }
  };
  if (state === 'sent' || state === 'demo') {
    return (
      <div className="rounded border border-line bg-ink-2 p-6" role="status">
        <EnvelopeSimple size={32} className="text-accent" />
        <p className="display mt-3 text-3xl">{state === 'sent' ? 'Check your email' : 'Demo mode'}</p>
        <p className="mt-2 text-mute">{state === 'sent' ? `Tap the link we sent to ${email} on this device.` : 'Sign-in turns on when the site connects to Supabase. Everything else works in demo mode.'}</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="rounded border border-line bg-ink-2 p-6">
      <label htmlFor="si-email" className="field-label">Email</label>
      <input id="si-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={Boolean(error)} aria-describedby={error ? 'si-err' : undefined} />
      {error && <p id="si-err" className="mt-1.5 text-sm text-danger">{error}</p>}
      <button type="submit" className="btn btn-primary mt-4 w-full" disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Email me a sign-in link'}</button>
    </form>
  );
}
