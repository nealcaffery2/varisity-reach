import type { ReactNode } from 'react';

export function PageHeader({ title, accent, children }: { title: string; accent?: string; children?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-line pt-32 pb-12 md:pt-40 md:pb-16">
      <div className="wrap">
        <h1 className="display text-[clamp(3.5rem,11vw,9rem)]">
          {title}
          {accent && <span className="text-accent"> {accent}</span>}
        </h1>
        {children && <div className="mt-6 max-w-2xl text-lg text-mute">{children}</div>}
      </div>
    </header>
  );
}
