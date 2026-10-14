import type { ConfSchool } from '@/content/conference';

/** A school's two official colors as a split swatch, then its name. Colors are IHSA's, not ours. */
export function Swatch({ school, size = 14 }: { school?: Pick<ConfSchool, 'colors' | 'name'>; size?: number }) {
  const [a = '#3a3a40', b] = school?.colors ?? [];
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-sm ring-1 ring-line-2"
      style={{ width: size, height: size, background: b ? `linear-gradient(135deg, ${a} 50%, ${b} 50%)` : a }}
    />
  );
}

export function TeamMark({ school, name, className = '' }: { school?: Pick<ConfSchool, 'colors' | 'name'>; name: string; className?: string }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Swatch school={school} />
      <span className="truncate">{name}</span>
    </span>
  );
}
