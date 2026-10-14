import Link from 'next/link';
import { FacebookLogo, InstagramLogo } from '@phosphor-icons/react/dist/ssr';
import { site } from '@/content/site';
import { NAV } from './nav-links';

export function Footer() {
  return (
    <footer className="no-print relative overflow-hidden border-t border-line bg-ink">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-5xl text-bone md:text-6xl">{site.rallyCry}.</p>
          <address className="mt-6 not-italic text-mute leading-relaxed">
            {site.school}
            <br />
            {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
            <br />
            <a className="link-u hover:text-bone" href={`tel:${site.phone.replace(/\D/g, '')}`}>{site.phone}</a>
          </address>
          <p className="mt-4 text-sm text-dim">
            Athletic Director {site.athleticDirector} · {site.conference}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-bone">On this site</h2>
          <ul className="mt-4 space-y-2.5 text-mute">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link className="link-u hover:text-bone" href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-bone">Official sources</h2>
          <ul className="mt-4 space-y-2.5 text-mute">
            <li><a className="link-u hover:text-bone" href={site.links.schedules}>Hiltopper Athletics schedules</a></li>
            <li><a className="link-u hover:text-bone" href={site.links.athletics}>HHS athletics office</a></li>
            <li><a className="link-u hover:text-bone" href={site.links.district}>Hillsboro CUSD 3</a></li>
            <li><a className="link-u hover:text-bone" href={site.links.ihsa}>IHSA</a></li>
          </ul>
          <div className="mt-6 flex gap-2">
            <a href={site.links.facebook} aria-label="Topper Pride on Facebook" className="inline-flex h-11 w-11 items-center justify-center rounded border border-line-2 text-mute hover:text-bone hover:border-bone transition-colors">
              <FacebookLogo size={20} />
            </a>
            <a href={site.links.instagram} aria-label="Hillsboro schools on Instagram" className="inline-flex h-11 w-11 items-center justify-center rounded border border-line-2 text-mute hover:text-bone hover:border-bone transition-colors">
              <InstagramLogo size={20} />
            </a>
          </div>
        </div>
      </div>
      <div className="wrap flex flex-col gap-2 border-t border-line py-6 text-xs text-dim md:flex-row md:justify-between">
        <p>A fan-built site for {site.school}. Schedules and official notices live on the district and athletics sites linked above.</p>
        <p>Template reels are stock clips from Pexels.</p>
      </div>
      <svg aria-hidden viewBox="0 0 1000 190" className="pointer-events-none -mb-[1vw] block w-full select-none" preserveAspectRatio="xMidYMax meet">
        <text x="500" y="182" textAnchor="middle" className="display" fontSize="240" fill="var(--color-ink-2)" textLength="980" lengthAdjust="spacingAndGlyphs">HILLSBORO</text>
      </svg>
    </footer>
  );
}
