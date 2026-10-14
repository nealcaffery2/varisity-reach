export type Season = 'Fall' | 'Winter' | 'Spring';

export type Sport = {
  slug: string;
  name: string;
  /** Short name for chips and tight rows. */
  short: string;
  season: Season;
  gender: 'Boys' | 'Girls' | 'Co-ed';
  /** Coaches as listed on hhs.hillsboroschools.net/athletics/coaches. */
  coaches: string[];
  /** 2026-27 schedule PDF on the HHS site, when one is posted. */
  scheduleUrl?: string;
  /** One clip that plays when the team row is hovered on the home page. */
  reel?: string;
  blurb: string;
  /** Stat columns this sport's leaderboards and profile tables show. */
  statKeys: StatKey[];
};

export type StatKey = {
  key: string;
  label: string;
  /** Long label for table headers and screen readers. */
  long: string;
  /** Lower is better (times, ERA). */
  lowerWins?: boolean;
  /** Format hint. */
  format?: 'int' | 'dec1' | 'dec2' | 'dec3' | 'time' | 'pct' | 'feet';
};

export type SeasonLine = {
  year: string; // "2025-26"
  level: 'Varsity' | 'JV' | 'Freshman';
  stats: Record<string, number>;
};

export type Classification = '1A' | '2A' | '3A' | '4A' | '5A' | '6A';

export type School = {
  slug: string;
  name: string; // "Hillsboro High School"
  town: string;
  state: string; // two-letter
  mascot: string; // "Hiltoppers"
  short: string; // "Toppers"
  classification: Classification;
  /** How the state association counts classes, e.g. "IHSA 3A football". */
  classNote?: string;
  conference: string;
  /** Invented school shipped to show the platform. Shows a tag and stays out of search. */
  sample: boolean;
  colors: { accent: string; accent2: string; accentInk: string; accentDeep: string; name: string };
  logo?: string;
  heroReel: string;
  rallyCry: string;
  address?: { street: string; city: string; state: string; zip: string };
  phone?: string;
  athleticDirector?: string;
  recruitingEmail?: string;
  links: Partial<Record<'district' | 'athletics' | 'schedules' | 'calendar' | 'coaches' | 'facebook' | 'instagram', string>>;
  /** Enrollment, so a recruiter sees how small the pond is. */
  enrollment?: number;
};

export type Athlete = {
  slug: string;
  school: string; // school slug
  first: string;
  last: string;
  /** Sample data shipped with the template. Shows a visible tag and keeps the profile out of search. */
  sample: boolean;
  gradYear: number;
  sports: string[]; // sport slugs, primary first
  position: string;
  jersey: number;
  heightIn: number;
  weightLb: number;
  gpa: number; // unweighted, 4.0 scale
  act?: number;
  sat?: number;
  coreGpa?: number;
  intendedMajor?: string;
  ncaaEligibility?: 'Registered' | 'In progress' | 'Not yet';
  measurables: { label: string; value: string }[];
  seasons: SeasonLine[];
  /** Personal records (track, lifts) or match records (wrestling, tennis). */
  records: { label: string; value: string; note?: string }[];
  awards: string[];
  bio: string;
  reels: string[]; // reel ids
  coach: string; // name of the coach who vouches
  /** Numbers signed off by a verified coach or reporter on the platform. */
  verified?: { by: string; role: 'coach' | 'reporter'; on: string };
  hometown: string;
  socials?: { x?: string; instagram?: string; hudl?: string };
};

export type Reel = {
  id: string;
  src: string;
  poster: string;
  sport: string; // sport slug
  athlete?: string; // athlete slug
  title: string;
  date: string; // ISO
  /** Credit line for stock footage used in the template. */
  credit?: string;
  /** Recruiters only: the family chose to show this clip to verified college coaches and nobody else. */
  audience?: 'public' | 'recruiters';
};

export type NewsItem = {
  slug: string;
  school: string;
  title: string;
  date?: string; // ISO; undated archive items leave it out
  sport?: string;
  summary: string;
  body: string[];
  source: { label: string; url: string };
  image?: string;
};

export type EventItem = {
  school: string;
  date: string; // ISO
  end?: string;
  title: string;
  detail?: string;
  kind: 'school' | 'game';
};
