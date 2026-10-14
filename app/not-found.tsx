import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="wrap flex min-h-[80svh] flex-col justify-center pt-24">
      <p className="num text-accent">404</p>
      <h1 className="display mt-2 text-[clamp(4rem,14vw,12rem)]">Out of bounds</h1>
      <p className="mt-4 max-w-md text-lg text-mute">That page is not here. It may have moved when a season rolled over.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">Home</Link>
        <Link href="/recruits/" className="btn btn-ghost">Recruit board</Link>
      </div>
    </main>
  );
}
