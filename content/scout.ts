import { athletes, fullName } from './athletes';
import { schoolBySlug } from './schools';
import type { Prospect, Needs } from '@/lib/scout';
import type { Athlete } from '@/lib/types';

// Scout board inputs. Production is computed from each athlete's latest
// season on their profile, against everyone on the network in the same
// sport, so it is only as real as the profiles are (today, all samples).
// Recruiter attention comes from the database in live mode and is zero here.

const latestStats = (a: Athlete) => a.seasons[0]?.stats ?? {};
const NEGATIVE = new Set(['int', 'era', 'fumbles', 'losses']); // lower is better; left out of production

/** 0..1: average share of the best mark in the sport, over the stats this athlete has. */
export function production(a: Athlete, pool: readonly Athlete[] = athletes): number {
  const sport = a.sports[0];
  const peers = pool.filter((p) => p.sports[0] === sport);
  const mine = Object.entries(latestStats(a)).filter(([k, v]) => !NEGATIVE.has(k) && v > 0);
  if (!mine.length) return 0;
  const shares = mine.map(([k, v]) => v / Math.max(...peers.map((p) => latestStats(p)[k] ?? 0), v));
  return Math.round((shares.reduce((x, y) => x + y, 0) / shares.length) * 100) / 100;
}

export type BoardProspect = Prospect & { name: string; school: string; schoolName: string; town: string; state: string; sample: boolean; heightIn: number; gpa: number };

export const prospects: BoardProspect[] = athletes.map((a) => {
  const s = schoolBySlug(a.school);
  return {
    slug: a.slug,
    name: fullName(a),
    school: a.school,
    schoolName: s?.name ?? a.school,
    town: s?.town ?? '',
    state: s?.state ?? '',
    sport: a.sports[0],
    position: a.position,
    gradYear: a.gradYear,
    production: production(a),
    enrollment: s?.enrollment,
    watchers: 0,
    sample: a.sample,
    heightIn: a.heightIn,
    gpa: a.gpa,
  };
});

export type RecruiterBoardEntry = Needs & { id: string; coach: string; program: string; division: 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO'; timeline: string; openToTapes: boolean; sample: true };

/** Sample needs posts so the board shows its shape. Invented coaches and programs. */
export const sampleNeeds: RecruiterBoardEntry[] = [
  {
    id: 'n1', sample: true, coach: 'Coach R. Talley', program: 'Sample State College football', division: 'D2',
    sports: ['football'], positions: ['RB', 'SS', 'OL'], classes: [2027], minHeightIn: 70, dontWant: ['K', 'P'],
    timeline: 'Evaluating junior film through December. Camp invites in March, offers after spring camp.', openToTapes: true,
  },
  {
    id: 'n2', sample: true, coach: 'Coach L. Brandt', program: 'Sample Lutheran College wrestling', division: 'D3',
    sports: ['wrestling'], positions: ['157 LB', '165 LB', '190 LB'], classes: [2027, 2028], dontWant: [],
    timeline: 'Filling the lineup for fall 2027. Visits any weekend; we answer every tape.', openToTapes: true,
  },
  {
    id: 'n3', sample: true, coach: 'Coach M. Okoye', program: 'Sample Valley University volleyball', division: 'NAIA',
    sports: ['volleyball'], positions: ['OH', 'L', 'DS'], classes: [2028], minGpa: 3.2, dontWant: ['S'],
    timeline: 'Club season film first. Unofficial visits in spring.', openToTapes: false,
  },
];
