import type { Want } from '@/lib/community';

/** Starting ideas with no votes, so a school's wants board is not blank on day one. Nobody voted for these yet. */
export const starterWants = (school: string): Want[] => [
  { id: `${school}-s1`, school, sport: 'football', title: 'Two-man blocking sled', detail: 'The line works off the same sled every day.', votes: 0, status: 'open' },
  { id: `${school}-s2`, school, title: 'Film camera and tripod for every team', detail: 'So every sport has game film to send colleges, not just football.', votes: 0, status: 'open' },
  { id: `${school}-s3`, school, title: 'ACT prep sessions after practice', votes: 0, status: 'open' },
];
