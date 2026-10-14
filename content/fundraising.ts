import type { Campaign } from '@/lib/fundraise';

// SAMPLE FUNDRAISERS. Every drive here is invented to show the layout and the
// game mechanics; amounts, donors and matches are not real. Real drives are
// created by a verified coach or athletic director from the coach dashboard,
// and only go live after the school (or its booster club) connects a payout
// account.

export const campaigns: Campaign[] = [
  {
    id: 'hillsboro-cash-for-cleats',
    school: 'hillsboro',
    sample: true,
    title: 'Cash for Cleats',
    kind: 'cleats',
    need: 'Thirty-one players on the freshman and JV rosters are playing in borrowed or worn-out cleats. $85 puts a new pair on one kid.',
    story: 'Every dollar buys molded cleats through the team order, sized at the start of practice. Leftover money rolls into next fall’s order.',
    goalCents: 263500,
    raisedCents: 141000,
    donors: 47,
    endsOn: '2026-11-06',
    createdBy: { name: 'Sample head coach', role: 'coach' },
    schoolBacked: true,
    coachBacked: 'Football staff',
    match: { by: 'A local implement dealer (sample)', ratio: 1, upToCents: 50000 },
    payee: 'Hillsboro booster club (sample)',
    milestones: [
      { atPct: 25, label: 'Freshman linemen fitted' },
      { atPct: 50, label: 'All freshmen fitted' },
      { atPct: 75, label: 'JV skill players fitted' },
      { atPct: 100, label: 'All 31 players fitted' },
    ],
    squads: [
      { name: 'Class of 2027', raisedCents: 41200 },
      { name: 'Class of 2028', raisedCents: 37800 },
      { name: 'Alumni', raisedCents: 45500 },
      { name: 'Class of 2029', raisedCents: 16500 },
    ],
    recent: [
      { name: 'A Topper family (sample)', amountCents: 8500, message: 'One pair for a lineman.', squad: 'Alumni', at: '2026-10-13' },
      { name: 'Anonymous', amountCents: 2500, squad: 'Class of 2028', at: '2026-10-12' },
      { name: 'Class of ’94 (sample)', amountCents: 17000, message: 'Two pairs from the ’94 line.', squad: 'Alumni', at: '2026-10-11' },
    ],
    image: '/media/reels/r1.jpg',
  },
  {
    id: 'hillsboro-state-bus',
    school: 'hillsboro',
    sample: true,
    title: 'Get the golf team to state',
    kind: 'travel',
    sport: 'boys-golf',
    need: 'A charter bus to Bloomington and one night of rooms for six players and two coaches.',
    story: 'The district covers the first state trip. A second straight trip comes out of the program budget, so this drive covers the bus and hotel.',
    goalCents: 240000,
    raisedCents: 198500,
    donors: 63,
    endsOn: '2026-10-22',
    createdBy: { name: 'Sample golf coach', role: 'coach' },
    schoolBacked: true,
    payee: 'Hillsboro booster club (sample)',
    milestones: [
      { atPct: 50, label: 'Bus booked' },
      { atPct: 100, label: 'Rooms booked' },
    ],
    squads: [],
    recent: [{ name: 'Anonymous', amountCents: 5000, at: '2026-10-13' }],
  },
  {
    id: 'prairie-bend-weight-room',
    school: 'prairie-bend',
    sample: true,
    title: 'Two racks for a 142-student school',
    kind: 'equipment',
    need: 'Our weight room has one squat rack for 58 athletes. Two more racks and bars cut the wait in half.',
    story: 'Quotes are from the school’s equipment vendor and include install.',
    goalCents: 640000,
    raisedCents: 172000,
    donors: 29,
    endsOn: '2026-12-15',
    createdBy: { name: 'Sample athletic director', role: 'athletic director' },
    schoolBacked: true,
    coachBacked: 'Every head coach at Prairie Bend',
    match: { by: 'The school board (sample)', ratio: 0.5, upToCents: 150000 },
    payee: 'Prairie Bend CSD (sample)',
    milestones: [
      { atPct: 50, label: 'First rack ordered' },
      { atPct: 100, label: 'Second rack and bars ordered' },
    ],
    squads: [
      { name: 'Football', raisedCents: 71000 },
      { name: 'Wrestling', raisedCents: 55500 },
      { name: 'Volleyball', raisedCents: 45500 },
    ],
    recent: [{ name: 'Voss family', amountCents: 25000, squad: 'Football', at: '2026-10-10' }],
    image: '/media/reels/r12.jpg',
  },
  {
    id: 'cedar-fork-camp',
    school: 'cedar-fork',
    sample: true,
    title: 'Send four seniors to college camps',
    kind: 'camp',
    need: 'Camp fees and gas for four seniors invited to college one-day camps this summer. Coaches there can only time a kid in person.',
    story: 'Each camp is $60 to $120 plus a 3 to 5 hour drive. The coach drives the van.',
    goalCents: 180000,
    raisedCents: 61500,
    donors: 18,
    endsOn: '2027-05-01',
    createdBy: { name: 'Sample head coach', role: 'coach' },
    schoolBacked: false,
    coachBacked: 'Head football coach',
    payee: 'Cedar Fork athletic booster club (sample)',
    milestones: [
      { atPct: 25, label: 'First senior registered' },
      { atPct: 100, label: 'All four registered' },
    ],
    squads: [],
    recent: [{ name: 'Anonymous', amountCents: 10000, message: 'Go get seen.', at: '2026-10-09' }],
    image: '/media/reels/r2.jpg',
  },
];

export const campaignById = (id: string) => campaigns.find((c) => c.id === id);
export const campaignsFor = (school: string) => campaigns.filter((c) => c.school === school);

export type GoldCard = {
  school: string;
  sample: boolean;
  season: string;
  priceCents: number;
  /** Where the money goes. */
  payee: string;
  perks: { merchant: string; offer: string }[];
};

/** Discount cards local businesses honor all season. All sample offers. */
export const goldCards: GoldCard[] = [
  {
    school: 'hillsboro',
    sample: true,
    season: '2026-27',
    priceCents: 2000,
    payee: 'Hillsboro booster club (sample)',
    perks: [
      { merchant: 'Sample pizza place', offer: '10% off any large pizza' },
      { merchant: 'Sample hardware store', offer: '$5 off $25' },
      { merchant: 'Sample coffee shop', offer: 'Free drink upgrade' },
      { merchant: 'Sample car wash', offer: '$3 off any wash' },
      { merchant: 'Sample diner', offer: 'Free dessert with an entree' },
    ],
  },
  {
    school: 'prairie-bend',
    sample: true,
    season: '2026-27',
    priceCents: 1500,
    payee: 'Prairie Bend CSD (sample)',
    perks: [
      { merchant: 'Sample co-op', offer: '5% off feed and supplies' },
      { merchant: 'Sample grill', offer: 'Free fries with a burger' },
    ],
  },
];

export const goldCardFor = (school: string) => goldCards.find((g) => g.school === school);
