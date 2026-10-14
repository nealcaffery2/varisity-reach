import type { NextConfig } from 'next';

// Static export: the whole site is plain files, so it hosts free on GitHub
// Pages, Vercel, Netlify or the district's own server.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default config;
