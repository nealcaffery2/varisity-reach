// School data: IHSA directory pages, color names, RSS/Atom feeds, NCES rows.
// Run: npx tsx tools/school-data.test.ts
import assert from 'node:assert/strict';
import { fromIhsaApi, parseIhsaDirectory, nicknames } from '../lib/ihsa-directory';
import { accentFor, colorsToHex, contrast } from '../lib/school-colors';
import { discoverFeeds, mergeFeeds, parseFeed, sportsOnly } from '../lib/feeds';
import { isHighSchool, matchKey, toNational } from '../lib/nces';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};

const page = `<html><title>IHSA Hillsboro</title><body>
<p>* Last updated at 3:36 pm on Monday, April 20, 2026</p>
<b>Hillsboro High School</b><br>522 E. Tremont St. ( <a>Google map</a> , <a>other maps</a> )<br>Hillsboro, IL&nbsp; 62049-1802<br>
<p>Phone: 217-532-2841</p><p>School Web Site: <a>www.hillsboroschools.net</a></p>
<p>Enrollment: 427</p><p>Conference(s): South Central</p>
<p>Nickname(s): Hiltoppers (boys), Hiltoppers (girls)</p><p>Colors: Orange/Black</p>
<p>School Type: Public Coed</p><p>County: Montgomery</p>
<p>Boys Athletic Director : Aaron Duff &nbsp; <a>[email&#160;protected]</a> phone 217-532-2841</p>
<p>Boys Football Head Coach : Joe Reed &nbsp; <a>[email&#160;protected]</a></p>
<p>Boys Bowling Head Coach : TBA</p>
</body></html>`;

test('IHSA directory page gives colors, mascot, enrollment, AD and coaches', () => {
  const s = parseIhsaDirectory(page, '0816')!;
  assert.equal(s.name, 'Hillsboro High School');
  assert.equal(s.street, '522 E. Tremont St.');
  assert.deepEqual([s.town, s.zip, s.enrollment, s.county], ['Hillsboro', '62049', 427, 'Montgomery']);
  assert.deepEqual(s.nicknames, ['Hiltoppers']);
  assert.deepEqual(s.colors, { text: 'Orange/Black', hex: ['#ff7f00', '#111111'] });
  assert.deepEqual(s.conferences, ['South Central']);
  assert.equal(s.website, 'https://www.hillsboroschools.net');
  assert.equal(s.athleticDirector, 'Aaron Duff');
  assert.deepEqual(s.coaches, { 'Boys Football': 'Joe Reed' });
  assert.equal(parseIhsaDirectory('<html>404</html>', '9999'), null);
});

test('IHSA API rows: official hex colors, west longitude, nicknames', () => {
  const s = fromIhsaApi({ SchoolID: '1609', NameIHSA: 'Pana', NameFormal: 'Pana High School', City: 'Pana', Zip: '62557', Color1: '#f86407', Color2: '#0d036c', Latitude: '39.3823', Longitude: '89.0872', NicknameBoys: 'Panthers', NicknameGirls: 'Lady Panthers', Enrollment: '375.00', URL: 'www.panaschools.com', Conferences: [{ ConferenceName: 'South Central' }] });
  assert.deepEqual([s.name, s.town, s.colors, s.geo, s.nicknames, s.enrollment, s.website, s.conferences], ['Pana High School', 'Pana', ['#f86407', '#0d036c'], [39.3823, -89.0872], ['Panthers', 'Lady Panthers'], 375, 'https://www.panaschools.com', ['South Central']]);
  assert.deepEqual(fromIhsaApi({ SchoolID: '1229', NameIHSA: 'Litchfield', Color1: '#550077', Color2: null }).colors, ['#550077']);
});

test('nicknames keep distinct girls names', () => {
  assert.deepEqual(nicknames('Panthers (boys), Lady Panthers (girls)'), ['Panthers', 'Lady Panthers']);
});

test('color words map to hex; accents stay readable on black', () => {
  assert.deepEqual(colorsToHex('Royal Blue & Gold'), ['#1d4ed8', '#ffb81c']);
  assert.deepEqual(colorsToHex('Purple and White'), ['#6f2da8', '#ffffff']);
  assert.deepEqual(colorsToHex('Maroon, Gray'), ['#862633', '#8a8d91']);
  for (const hex of [['#1b2a4a'], ['#6f2da8', '#ffffff'], ['#862633'], ['#111111', '#ffffff']]) {
    assert.ok(contrast(accentFor(hex).accent, '#0b0b0c') >= 4.5, hex.join());
  }
  assert.equal(accentFor(['#111111', '#ff7f00']).accent, '#ff7f00');
});

const rss = `<?xml version="1.0"?><rss><channel>
<item><title>Lunch menu</title><link>https://s.org/lunch</link><pubDate>Mon, 12 Oct 2026 08:00:00 GMT</pubDate></item>
<item><title><![CDATA[Toppers win &amp; clinch SCC title]]></title><link>https://s.org/scc</link><pubDate>Sat, 10 Oct 2026 02:00:00 GMT</pubDate>
<description><![CDATA[<p><img src="https://s.org/a.jpg">Hillsboro football beat Staunton.</p>]]></description></item>
</channel></rss>`;
const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Toppers win and clinch SCC title</title><link href="https://paper.com/x"/><updated>2026-10-10T03:00:00Z</updated></entry>
<entry><title>Volleyball sweeps Pana</title><link rel="alternate" href="https://paper.com/vb"/><updated>2026-10-13T01:00:00Z</updated><summary>Three sets.</summary></entry></feed>`;

test('RSS and Atom parse, newest first, with images and decoded titles', () => {
  const r = parseFeed(rss);
  assert.equal(r[0].title, 'Lunch menu');
  assert.equal(r[1].title, 'Toppers win & clinch SCC title');
  assert.equal(r[1].image, 'https://s.org/a.jpg');
  assert.equal(r[1].summary, 'Hillsboro football beat Staunton.');
  const a = parseFeed(atom);
  assert.deepEqual(a.map((x) => x.url), ['https://paper.com/vb', 'https://paper.com/x']);
  assert.deepEqual(parseFeed('<html></html>'), []);
});

test('sports filter and merge drop menus and syndicated duplicates', () => {
  assert.deepEqual(sportsOnly(parseFeed(rss)).map((x) => x.url), ['https://s.org/scc']);
  const m = mergeFeeds(parseFeed(rss), parseFeed(atom));
  assert.equal(m.filter((x) => /clinch/.test(x.title)).length, 1);
  assert.equal(m[0].title, 'Volleyball sweeps Pana');
});

test('feed discovery reads link tags first, then common paths', () => {
  const f = discoverFeeds('<head><link rel="alternate" type="application/rss+xml" href="/news/feed.xml"></head>', 'https://hhs.example.org/athletics');
  assert.equal(f[0], 'https://hhs.example.org/news/feed.xml');
  assert.ok(f.includes('https://hhs.example.org/rss'));
});

test('NCES rows: high schools only, tidy names, match keys line up with IHSA', () => {
  const row = { ncessch: '171926001234', school_name: 'HILLSBORO HIGH SCHOOL', city_location: 'HILLSBORO', state_location: 'IL', zip_location: '62049-1802', website: 'www.hillsboroschools.net', lowest_grade_offered: 9, highest_grade_offered: 12, enrollment: 427 };
  assert.ok(isHighSchool(row));
  assert.ok(!isHighSchool({ ...row, highest_grade_offered: 8 }));
  const n = toNational(row);
  assert.deepEqual([n.name, n.town, n.zip, n.website, n.slug], ['Hillsboro High School', 'Hillsboro', '62049', 'https://www.hillsboroschools.net', 'hillsboro-high-school-il']);
  assert.equal(matchKey(n.name, n.town), matchKey('Hillsboro H.S.', 'Hillsboro'));
});

console.log(`school-data: ${passed} passed`);
