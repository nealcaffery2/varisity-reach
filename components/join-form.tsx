'use client';

import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { schools } from '@/content/schools';
import { requestVerification, type VerifyRequest } from '@/lib/backend';

const ROLES: { value: VerifyRequest['role']; label: string; what: string }[] = [
  { value: 'coach', label: 'Head or assistant coach', what: 'We confirm you with your athletic director.' },
  { value: 'athletic director', label: 'Athletic director', what: 'We call the school office number listed by the district.' },
  { value: 'reporter', label: 'Local reporter or broadcaster', what: 'Send a link to work you have published or aired.' },
  { value: 'official scorer', label: 'Official scorer or PA', what: 'Your athletic director confirms you for home games.' },
];

/** One form for every role that can lock scores, verify stats or write spotlights. */
export function JoinForm({ addSchool = false }: { addSchool?: boolean }) {
  const [role, setRole] = useState<VerifyRequest['role']>(addSchool ? 'athletic director' : 'coach');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState(addSchool ? '' : schools[0].slug);
  const [outlet, setOutlet] = useState('');
  const [proof, setProof] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ demo: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 3) errs.name = 'Add your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Add an email we can reach you at. A school address is fastest.';
    if (!school.trim()) errs.school = addSchool ? 'Add the school’s name and town.' : 'Pick your school.';
    if (role === 'reporter' && !/^https?:\/\//.test(proof)) errs.proof = 'Link to a story, broadcast or page with your byline.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await requestVerification({ role, name: name.trim(), email: email.trim(), school: school.trim(), outlet: outlet.trim() || undefined, proofUrl: proof.trim() || undefined, note: note.trim() || undefined });
      setDone({ demo: Boolean(res.demo) });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'That did not send.' });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded border border-line bg-ink-2 p-8" role="status">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-ink"><Check size={24} weight="bold" /></span>
        <p className="display mt-4 text-4xl">Request sent</p>
        <p className="mt-2 max-w-md text-mute">We check every request by hand, usually within two school days, and reply to {email}.{done.demo && ' Demo mode: saved in this browser only.'}</p>
      </div>
    );
  }

  const err = (k: string) => errors[k] && <p id={`${k}-err`} className="mt-1.5 text-sm text-danger">{errors[k]}</p>;
  const current = ROLES.find((r) => r.value === role)!;

  return (
    <form onSubmit={submit} noValidate className="rounded border border-line bg-ink-2 p-5 md:p-6">
      <fieldset>
        <legend className="field-label">I am a</legend>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => <button key={r.value} type="button" className="chip" aria-pressed={role === r.value} onClick={() => setRole(r.value)}>{r.label}</button>)}
        </div>
        <p className="mt-2 text-sm text-dim">{current.what}</p>
      </fieldset>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="j-name" className="field-label">Full name</label>
          <input id="j-name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-err' : undefined} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="j-email" className="field-label">Email</label>
          <input id="j-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-err' : undefined} />
          {err('email')}
        </div>
        <div className="md:col-span-2">
          <label htmlFor="j-school" className="field-label">{addSchool ? 'School name and town' : 'School'}</label>
          {addSchool ? (
            <input id="j-school" className="field" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Hillsboro High School, Hillsboro, IL" aria-invalid={Boolean(errors.school)} aria-describedby={errors.school ? 'school-err' : undefined} />
          ) : (
            <select id="j-school" className="field" value={school} onChange={(e) => setSchool(e.target.value)}>
              {schools.map((s) => <option key={s.slug} value={s.slug}>{s.name}, {s.state}</option>)}
            </select>
          )}
          {err('school')}
        </div>
        {role === 'reporter' && (
          <>
            <div>
              <label htmlFor="j-outlet" className="field-label">Outlet</label>
              <input id="j-outlet" className="field" value={outlet} onChange={(e) => setOutlet(e.target.value)} />
            </div>
            <div>
              <label htmlFor="j-proof" className="field-label">Link to your work</label>
              <input id="j-proof" type="url" className="field" value={proof} onChange={(e) => setProof(e.target.value)} aria-invalid={Boolean(errors.proof)} aria-describedby={errors.proof ? 'proof-err' : undefined} />
              {err('proof')}
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label htmlFor="j-note" className="field-label">Anything we should know (optional)</label>
          <textarea id="j-note" rows={3} className="field min-h-24 py-3" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      {err('form')}
      <button type="submit" className="btn btn-primary mt-6" disabled={busy}>{busy ? 'Sending…' : addSchool ? 'Request a school site' : 'Request verification'}</button>
    </form>
  );
}
