import { Footer } from '@/components/footer';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
