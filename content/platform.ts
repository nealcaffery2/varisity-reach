// The network every school site lives inside.
export const platform = {
  name: 'Varsity Reach',
  tagline: 'Small schools. Real numbers. Seen by the people who sign.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://varsityreach.example.com',
  supportEmail: 'hello@varsityreach.example.com',
  /** Brand accent outside a school site. School pages swap in their own colors. */
  accent: '#ff5b1f',
  /** Percent kept by the platform on each gift. A business decision; shown on every fundraiser. */
  feePct: 0,
} as const;
