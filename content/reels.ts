import type { Reel } from '@/lib/types';

// Template clips are free stock footage from Pexels (pexels.com/license),
// trimmed to 8 seconds. Swap `src` for real Topper film: an .mp4 in
// public/media/reels, or any direct video URL from Hudl or a phone upload.
const PEXELS = 'Stock clip via Pexels';

const r = (id: string, sport: string, athlete: string | undefined, title: string, date: string): Reel => ({
  id,
  src: `/media/reels/${id}.mp4`,
  poster: `/media/reels/${id}.jpg`,
  sport,
  athlete,
  title,
  date,
  credit: PEXELS,
});

export const reels: Reel[] = [
  r('r1', 'football', 'cade-rakers', 'Sideline to sideline, 62 yards to the house', '2026-10-09'),
  r('r10', 'boys-basketball', 'brennan-hough', 'Pull-up three in transition', '2026-02-13'),
  r('r12', 'track-and-field', 'tatum-bohlen', '300 hurdles, sectional final', '2026-05-15'),
  r('r14', 'wrestling', 'maddox-kessinger', 'Single leg to a cradle at 157', '2026-01-24'),
  r('r16', 'girls-tennis', 'reese-kirchner', 'No. 1 singles, serve plus one', '2026-09-22'),
  r('r11', 'girls-basketball', 'kaylee-schaefer', 'And-one through contact', '2026-01-30'),
  r('r13', 'track-and-field', 'owen-fesser', 'Lane 4 finish, 400 relay anchor', '2026-04-25'),
  r('r15', 'wrestling', 'grady-luebbert', 'Mat return off the whistle', '2026-02-07'),
  r('r3', 'girls-flag-football', 'brooklyn-haller', 'Pick six, flag football opener', '2026-09-03'),
  r('r6', 'boys-soccer', 'jace-wernsing', 'Breakaway finish near post', '2026-09-18'),
  r('r17', 'boys-tennis', 'ty-roesch', 'Crosscourt winner on break point', '2026-04-11'),
  r('r2', 'football', 'avery-niehaus', 'Senior night at the Sports Complex', '2026-10-02'),
];

export const reelById = (id: string) => reels.find((x) => x.id === id);
