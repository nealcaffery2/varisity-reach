export type NavLink = { href: string; label: string };

export const PLATFORM_NAV: NavLink[] = [
  { href: '/recruits/', label: 'Recruits' },
  { href: '/scout/', label: 'Scout' },
  { href: '/spotlight/', label: 'Spotlight' },
  { href: '/games/', label: 'Games' },
  { href: '/conference/scc/', label: 'Conference' },
  { href: '/reels/', label: 'Reels' },
  { href: '/fundraise/', label: 'Fundraise' },
  { href: '/schools/', label: 'Schools' },
];

export const schoolNav = (school: string): NavLink[] => [
  { href: `/${school}/teams/`, label: 'Teams' },
  { href: `/recruits/?school=${school}`, label: 'Recruits' },
  { href: `/games/?school=${school}`, label: 'Games' },
  { href: `/${school}/news/`, label: 'News' },
  { href: `/${school}/schedule/`, label: 'Schedule' },
  { href: `/fundraise/?school=${school}`, label: 'Fundraise' },
  { href: `/${school}/boosters/`, label: 'Boosters' },
  { href: `/${school}/community/`, label: 'Wants' },
];

/** Kept for pages that still list the platform sections. */
export const NAV = PLATFORM_NAV;
