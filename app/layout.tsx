import type { Metadata, Viewport } from 'next';
import { Barlow, Big_Shoulders, Geist_Mono } from 'next/font/google';
import { platform } from '@/content/platform';
import { Nav } from '@/components/nav';
import { SmoothScroll } from '@/components/smooth-scroll';
import { asset } from '@/lib/asset';
import './globals.css';

const display = Big_Shoulders({ subsets: ['latin'], weight: ['700', '800', '900'], variable: '--font-big-shoulders', display: 'swap' });
const sans = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-barlow', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(platform.url),
  title: { default: `${platform.name} | Small-school athletes, seen`, template: `%s | ${platform.name}` },
  description: 'Recruiting profiles, verified stats, game-day scores and film for athletes at 1A to 4A high schools.',
  openGraph: { type: 'website', siteName: platform.name, images: [asset('/brand/og.jpg')] },
  twitter: { card: 'summary_large_image' },
  icons: { icon: asset('/brand/Hillsboro.png'), apple: asset('/brand/Hillsboro.png') },
};

export const viewport: Viewport = { themeColor: '#0c0c0d', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] btn btn-primary">
          Skip to content
        </a>
        <SmoothScroll />
        <Nav />
        {children}
      </body>
    </html>
  );
}
