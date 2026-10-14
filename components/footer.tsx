import Link from 'next/link';
import { FacebookLogo, InstagramLogo } from '@phosphor-icons/react/dist/ssr';
import type { School } from '@/lib/types';
import { platform } from '@/content/platform';
import { PLATFORM_NAV, schoolNav } from './nav-links';
import { Wordmark } from './wordmark';

const icon = 'inline-flex h-11 w-11 items-center justify-center rounded border border-line-2 text-mute transition-colors hover:border-bone hover:text-bone';

export function Footer({ school }: { school?: School }) {
  const links = school ? schoolNav(school.slug) : PLATFORM_NAV;
  return (
    <footer className="no-print relative overflow-hidden border-t border-line bg-ink">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {school ? (
            <>
              <p className="display text-5xl text-bone md:text-6xl">{school.rallyCry}.</p>
              <p className="mt-6 leading-relaxed text-mute">
                {school.name}
                {school.address && (
                  <>
                    <br />
                    {school.address.street}, {school.address.city}, {school.address.state} {school.address.zip}
                  </>
                )}
                {school.phone && (
                  <>
                    <br />
                    <a className="link-u hover:text-bone" href={`tel:${school.phone.replace(/\D/g, '')}`}>{school.phone}</a>
                  </>
                )}
              </p>
              <p className="mt-4 text-sm text-dim">
                {school.athleticDirector && <>Athletic Director {school.athleticDirector} · </>}
                {school.conference} · {school.classification}
              </p>
              {school.sample && <p className="mt-3 text-sm text-dim">Sample school. The town, team and athletes are made up to show the platform.</p>}
            </>
          ) : (
            <>
              <Wordmark />
              <p className="mt-6 max-w-sm text-mute">{platform.tagline}</p>
              <p className="mt-4 text-sm text-dim">For 1A to 4A schools. Free for athletes, always.</p>
            </>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-bone">{school ? `${school.short} on this site` : 'Explore'}</h2>
          <ul className="mt-4 space-y-2.5 text-mute">
            {links.map((n) => (
              <li key={n.href}><Link className="link-u hover:text-bone" href={n.href}>{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-bone">{school && !school.sample ? 'Official sources' : 'Get involved'}</h2>
          <ul className="mt-4 space-y-2.5 text-mute">
            {school && !school.sample ? (
              <>
                {school.links.schedules && <li><a className="link-u hover:text-bone" href={school.links.schedules}>Official schedules</a></li>}
                {school.links.athletics && <li><a className="link-u hover:text-bone" href={school.links.athletics}>Athletics office</a></li>}
                {school.links.district && <li><a className="link-u hover:text-bone" href={school.links.district}>School district</a></li>}
                <li><Link className="link-u hover:text-bone" href={`/${school.slug}/claim/`}>Claim this page</Link></li>
                <li><Link className="link-u hover:text-bone" href="/">{platform.name}</Link></li>
              </>
            ) : (
              <>
                <li><Link className="link-u hover:text-bone" href="/about/">About Varsity Reach</Link></li>
                <li><Link className="link-u hover:text-bone" href="/family/">Parents and athletes</Link></li>
                <li><Link className="link-u hover:text-bone" href="/scout/">College coaches</Link></li>
                <li><Link className="link-u hover:text-bone" href="/media/">Photographers</Link></li>
                <li><Link className="link-u hover:text-bone" href="/grants/">Grants</Link></li>
                <li><Link className="link-u hover:text-bone" href="/awards/">Bleacher awards</Link></li>
                <li><Link className="link-u hover:text-bone" href="/coach/">Coach dashboard</Link></li>
                <li><Link className="link-u hover:text-bone" href="/join/">Get verified</Link></li>
                <li><Link className="link-u hover:text-bone" href="/gold-card/">Gold card</Link></li>
                <li><Link className="link-u hover:text-bone" href="/schools/">Add your school</Link></li>
                <li><Link className="link-u hover:text-bone" href="/account/">Notifications</Link></li>
                <li><Link className="link-u hover:text-bone" href="/sign-in/">Sign in</Link></li>
              </>
            )}
          </ul>
          {school && (school.links.facebook || school.links.instagram) && (
            <div className="mt-6 flex gap-2">
              {school.links.facebook && <a href={school.links.facebook} aria-label={`${school.short} on Facebook`} className={icon}><FacebookLogo size={20} /></a>}
              {school.links.instagram && <a href={school.links.instagram} aria-label={`${school.short} on Instagram`} className={icon}><InstagramLogo size={20} /></a>}
            </div>
          )}
        </div>
      </div>
      <div className="wrap flex flex-col gap-2 border-t border-line py-6 text-xs text-dim md:flex-row md:justify-between">
        <p>{school ? `${school.name} on ${platform.name}. Game-day changes post on the school's official sites first.` : `${platform.name}. Built for towns ESPN never sends a camera to.`}</p>
        <p>Template reels are stock clips from Pexels.</p>
      </div>
      <svg aria-hidden viewBox="0 0 1000 190" className="pointer-events-none -mb-[1vw] block w-full select-none" preserveAspectRatio="xMidYMax meet">
        <text x="500" y="182" textAnchor="middle" className="display" fontSize="240" fill="var(--color-ink-2)" textLength="980" lengthAdjust="spacingAndGlyphs">
          {(school?.town ?? 'Varsity').toUpperCase()}
        </text>
      </svg>
    </footer>
  );
}
