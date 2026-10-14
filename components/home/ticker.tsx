import { Lightning } from '@phosphor-icons/react/dist/ssr';

/** Results crawl under the hero. Doubled so the CSS loop is seamless. */
export function Ticker({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-6 pr-6">
          <span className="display text-2xl text-bone md:text-3xl">{t}</span>
          <Lightning size={18} weight="fill" className="text-orange" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="relative overflow-hidden border-y border-line bg-ink-2 py-4" aria-label="Recent results">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
