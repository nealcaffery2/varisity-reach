import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { platform } from '@/content/platform';
import { Nav } from '@/components/nav';
import { SmoothScroll } from '@/components/smooth-scroll';
import { asset } from '@/lib/asset';
import './globals.css';

// Fonts ship with the repo (latin subsets from Google Fonts, OFL) so builds
// never depend on reaching fonts.googleapis.com.
const display = localFont({ src: [{ path: './fonts/big-shoulders-var.woff2', weight: '700 900' }], variable: '--font-big-shoulders', display: 'swap' });
const sans = localFont({
  src: [
    { path: './fonts/barlow-400.woff2', weight: '400' },
    { path: './fonts/barlow-500.woff2', weight: '500' },
    { path: './fonts/barlow-600.woff2', weight: '600' },
    { path: './fonts/barlow-700.woff2', weight: '700' },
  ],
  variable: '--font-barlow',
  display: 'swap',
});
const mono = localFont({ src: [{ path: './fonts/geist-mono-var.woff2', weight: '100 900' }], variable: '--font-geist-mono', display: 'swap' });

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
