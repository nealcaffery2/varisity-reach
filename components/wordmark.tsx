/** Varsity Reach mark: a V with a rising tick, then the name in the display face. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden className="shrink-0">
        <rect width="64" height="64" rx="6" fill="var(--color-accent)" />
        <path d="M14 18h9l9 20 9-20h9L36 48h-8z" fill="var(--color-accent-ink)" />
        <path d="M41 18h9l-4 9h-9z" fill="var(--color-bone)" />
      </svg>
      <span className="display text-2xl leading-none text-bone">Varsity Reach</span>
    </span>
  );
}
