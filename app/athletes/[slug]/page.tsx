import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, EnvelopeSimple, Info, Medal, Trophy } from '@phosphor-icons/react/dist/ssr';
import { athletes, athleteBySlug, fullName } from '@/content/athletes';
import { sportBySlug } from '@/content/sports';
import { reelById } from '@/content/reels';
import { site } from '@/content/site';
import { ShareBar } from '@/components/share-bar';
import { AutoplayVideo } from '@/components/autoplay-video';
import { Reveal } from '@/components/reveal';
import { feetInches, formatStat, gpa } from '@/lib/format';
import { asset } from '@/lib/asset';
import type { Athlete } from '@/lib/types';

export const dynamicParams = false;
export const generateStaticParams = () => athletes.map((a) => ({ slug: a.slug }));

type Props = { params: Promise<{ slug: string }> };

const headline = (a: Athlete) => {
  const s = sportBySlug(a.sports[0]);
  return `${fullName(a)}, ${a.gradYear} ${a.position}, ${s?.name ?? ''}, ${site.school}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = athleteBySlug((await params).slug);
  if (!a) return {};
  const desc = `${feetInches(a.heightIn)}, ${a.weightLb} lb, ${gpa(a.gpa)} GPA. ${a.bio}`;
  const poster = a.reels[0] ? reelById(a.reels[0])?.poster : undefined;
  return {
    title: `${fullName(a)} | ${a.gradYear} ${a.position}`,
    description: desc,
    robots: a.sample ? { index: false, follow: true } : undefined,
    openGraph: { type: 'profile', title: headline(a), description: desc, images: poster ? [asset(poster)] : undefined },
  };
}

export default async function AthletePage({ params }: Props) {
  const a = athleteBySlug((await params).slug);
  if (!a) notFound();
  const sport = sportBySlug(a.sports[0]);
  const reels = a.reels.map(reelById).filter((r) => r !== undefined);
  const hero = reels[0];
  const keys = sport ? sport.statKeys.filter((k) => a.seasons.some((s) => s.stats[k.key] !== undefined)) : [];
  // Track and multi-sport athletes can carry stats outside their first sport's columns.
  const extraKeys = a.sports.slice(1).flatMap((slug) => sportBySlug(slug)?.statKeys ?? []).filter((k) => !keys.some((x) => x.key === k.key) && a.seasons.some((s) => s.stats[k.key] !== undefined));
  const cols = [...keys, ...extraKeys];
  const contactSubject = `Recruiting: ${fullName(a)} (${a.gradYear}, ${sport?.name})`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName(a),
    affiliation: { '@type': 'HighSchool', name: site.school, address: `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}` },
    height: `${a.heightIn} in`,
    weight: `${a.weightLb} lb`,
    award: a.awards,
  };

  const facts = [
    ['Class', String(a.gradYear)],
    ['Height', feetInches(a.heightIn)],
    ['Weight', `${a.weightLb} lb`],
    ['GPA', gpa(a.gpa)],
    ...(a.act ? [['ACT', String(a.act)]] : a.sat ? [['SAT', String(a.sat)]] : []),
  ];

  return (
    <>
      {!a.sample && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <section className="relative overflow-hidden border-b border-line pt-24 md:pt-28">
        <span aria-hidden className="display pointer-events-none absolute -right-8 top-10 select-none text-[clamp(16rem,40vw,34rem)] leading-none text-transparent [-webkit-text-stroke:1px_var(--color-line-2)]">
          {a.jersey}
        </span>
        <div className="wrap relative grid gap-10 pb-12 lg:grid-cols-[1fr_22rem] lg:items-end lg:gap-16">
          <div>
            <Link href="/athletes/" className="no-print inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-bone"><ArrowLeft size={16} /> Recruit board</Link>
            {a.sample && (
              <p className="mt-4 flex w-fit items-center gap-2 rounded border border-line-2 px-3 py-1.5 text-sm text-mute">
                <Info size={16} /> Sample profile. The athlete and numbers are made up to show the layout.
              </p>
            )}
            <p className="mt-6 text-orange">{sport?.name} · {a.position} · #{a.jersey}</p>
            <h1 className="display mt-2 text-[clamp(4rem,12vw,10rem)]">
              <span className="block text-mute">{a.first}</span>
              <span className="block">{a.last}</span>
            </h1>
            <dl className="mt-8 flex flex-wrap gap-px overflow-hidden rounded border border-line bg-line">
              {facts.map(([k, v]) => (
                <div key={k} className="min-w-[6.5rem] flex-1 bg-ink p-4">
                  <dt className="text-xs text-dim">{k}</dt>
                  <dd className="num mt-1 whitespace-nowrap text-xl text-bone sm:text-2xl">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8"><ShareBar title={headline(a)} text={`${fullName(a)}, ${a.gradYear} ${a.position} at ${site.school}. Stats, measurables and film:`} /></div>
          </div>
          {hero && (
            <div className="no-print relative mx-auto aspect-[9/16] w-full max-w-[22rem] overflow-hidden rounded border border-line bg-ink-2">
              <AutoplayVideo src={asset(hero.src)} poster={asset(hero.poster)} className="h-full w-full object-cover" threshold={0.2} aria-label={`Highlight: ${hero.title}`} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-4">
                <p className="text-sm font-semibold">{hero.title}</p>
                <Link href={`/reels/#${hero.id}`} className="mt-1 inline-flex min-h-6 text-xs text-orange hover:underline">Open in reels</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="wrap grid gap-16 py-16 md:py-20 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-16">
          <Reveal as="section">
            <h2 className="display text-4xl">Scouting note</h2>
            <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-bone/90">{a.bio}</p>
            <p className="mt-3 text-sm text-dim">Coach: {a.coach} · Hometown: {a.hometown}</p>
          </Reveal>

          {cols.length > 0 && (
            <section aria-labelledby="stats-h">
              <h2 id="stats-h" className="display text-4xl">Season stats</h2>
              <div className="mt-6 overflow-x-auto rounded border border-line" data-lenis-prevent>
                <table className="w-full text-sm">
                  <caption className="sr-only">Season-by-season statistics for {fullName(a)}</caption>
                  <thead className="border-b border-line bg-ink-2">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mute">Season</th>
                      {cols.map((k) => (
                        <th key={k.key} scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-mute"><abbr title={k.long} className="no-underline">{k.label}</abbr></th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {a.seasons.map((s) => (
                      <tr key={s.year + s.level}>
                        <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-normal text-bone">{s.year} <span className="text-dim">{s.level}</span></th>
                        {cols.map((k) => <td key={k.key} className="num px-4 py-3 text-right text-bone">{formatStat(s.stats[k.key], k)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section aria-labelledby="meas-h" className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 id="meas-h" className="display text-4xl">Measurables</h2>
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {a.measurables.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between py-3">
                    <dt className="text-mute">{m.label}</dt>
                    <dd className="num text-lg text-bone">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="display text-4xl">Records</h2>
              {a.records.length ? (
                <dl className="mt-6 divide-y divide-line border-y border-line">
                  {a.records.map((r) => (
                    <div key={r.label} className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="text-mute">{r.label}{r.note && <span className="block text-xs text-dim">{r.note}</span>}</dt>
                      <dd className="num text-lg text-orange">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-6 text-mute">No personal records posted yet.</p>
              )}
            </div>
          </section>

          {a.awards.length > 0 && (
            <section aria-labelledby="awards-h">
              <h2 id="awards-h" className="display text-4xl">Honors</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {a.awards.map((w, i) => (
                  <li key={w} className="flex items-start gap-3 rounded border border-line p-4">
                    {i === 0 ? <Trophy size={20} className="mt-0.5 shrink-0 text-orange" /> : <Medal size={20} className="mt-0.5 shrink-0 text-mute" />}
                    <span className="text-bone">{w}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reels.length > 1 && (
            <section aria-labelledby="film-h" className="no-print">
              <h2 id="film-h" className="display text-4xl">More film</h2>
              <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                {reels.slice(1).map((r) => (
                  <li key={r.id}>
                    <Link href={`/reels/#${r.id}`} className="block aspect-[9/16] overflow-hidden rounded bg-ink-2">
                      <AutoplayVideo src={asset(r.src)} poster={asset(r.poster)} className="h-full w-full object-cover" aria-label={r.title} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start" aria-label="Academics and contact">
          <section className="rounded border border-line bg-ink-2 p-6">
            <h2 className="display text-3xl">Academics</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-mute">GPA (unweighted)</dt><dd className="num text-bone">{gpa(a.gpa)}</dd></div>
              {a.coreGpa && <div className="flex justify-between gap-4"><dt className="text-mute">NCAA core GPA</dt><dd className="num text-bone">{gpa(a.coreGpa)}</dd></div>}
              {a.act && <div className="flex justify-between gap-4"><dt className="text-mute">ACT</dt><dd className="num text-bone">{a.act}</dd></div>}
              {a.sat && <div className="flex justify-between gap-4"><dt className="text-mute">SAT</dt><dd className="num text-bone">{a.sat}</dd></div>}
              {a.ncaaEligibility && <div className="flex justify-between gap-4"><dt className="text-mute">NCAA Eligibility Center</dt><dd className="text-bone">{a.ncaaEligibility}</dd></div>}
              {a.intendedMajor && <div className="flex justify-between gap-4"><dt className="text-mute">Intended major</dt><dd className="text-right text-bone">{a.intendedMajor}</dd></div>}
            </dl>
            <p className="mt-4 text-xs text-dim">Transcripts go out through the HHS counseling office with family consent.</p>
          </section>
          <section className="rounded border border-orange/40 p-6">
            <h2 className="display text-3xl">Recruiting contact</h2>
            <p className="mt-3 text-sm text-mute">Head coach {a.coach}, through Athletic Director {site.athleticDirector}.</p>
            {a.sample ? (
              <p className="mt-5 text-sm text-dim">Contact is turned off on sample profiles.</p>
            ) : (
              <a href={`mailto:${site.recruitingEmail}?subject=${encodeURIComponent(contactSubject)}`} className="btn btn-primary mt-5 w-full"><EnvelopeSimple size={18} /> Email the athletic office</a>
            )}
          </section>
        </aside>
      </div>

      <p className="print-only wrap pb-8 text-sm">{site.school} · {site.address.street}, {site.address.city}, {site.address.state} · {site.phone}</p>
    </>
  );
}
