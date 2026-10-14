import { notFound } from 'next/navigation';
import { schools, schoolBySlug, schoolTheme } from '@/content/schools';
import { Footer } from '@/components/footer';

export const dynamicParams = false;
export const generateStaticParams = () => schools.map((s) => ({ school: s.slug }));

/** A school's own site: same platform, the school's colors and name on everything. */
export default async function SchoolLayout({ children, params }: { children: React.ReactNode; params: Promise<{ school: string }> }) {
  const school = schoolBySlug((await params).school);
  if (!school) notFound();
  return (
    <div style={schoolTheme(school) as React.CSSProperties}>
      <main id="main">{children}</main>
      <Footer school={school} />
    </div>
  );
}
