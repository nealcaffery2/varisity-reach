// GENERATED from lib/ by tools/sync-functions.ts. Edit the lib/ copy, then run `pnpm sync:functions`.
// School and local-paper news by RSS or Atom. Most school sites (Finalsite,
// Edlio, Apptegy, WordPress) and nearly every newspaper CMS publish a feed;
// we find it from the home page's <link rel="alternate"> tags or the usual
// paths, then read items. Pure string work so it runs in the browser, Node
// and the Deno edge function alike. Tests: tools/school-data.test.ts.

export type FeedItem = { title: string; url: string; published?: string; summary?: string; image?: string };

const COMMON_PATHS = ['/feed', '/rss', '/rss.xml', '/feed.xml', '/atom.xml', '/news/rss', '/index.xml', '/?feed=rss2'];

const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];

/** Feed URLs a page advertises, resolved against the page URL, then common guesses. */
export function discoverFeeds(html: string, pageUrl: string): string[] {
  const found: string[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const type = attr(tag, 'type') ?? '';
    if (/alternate/i.test(attr(tag, 'rel') ?? '') && /(rss|atom)\+xml/i.test(type)) {
      const href = attr(tag, 'href');
      if (href) found.push(new URL(href, pageUrl).toString());
    }
  }
  const origin = new URL(pageUrl).origin;
  return [...new Set([...found, ...COMMON_PATHS.map((p) => origin + p)])];
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&');

const strip = (s: string) => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tagText = (xml: string, name: string) => xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'))?.[1];

const iso = (d?: string) => {
  if (!d) return undefined;
  const t = Date.parse(strip(d));
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
};

const clip = (s: string, n = 220) => (s.length > n ? s.slice(0, s.lastIndexOf(' ', n)) + '…' : s);

/** Items from an RSS 2.0 or Atom document, newest first. Unknown XML gives []. */
export function parseFeed(xml: string): FeedItem[] {
  const isAtom = /<feed\b/i.test(xml) && !/<rss\b/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi) ?? [];
  const items = blocks
    .map((b): FeedItem | null => {
      const title = strip(tagText(b, 'title') ?? '');
      let url = '';
      if (isAtom) {
        const links = b.match(/<link\b[^>]*>/gi) ?? [];
        const alt = links.find((l) => !attr(l, 'rel') || attr(l, 'rel') === 'alternate') ?? links[0];
        url = (alt && attr(alt, 'href')) ?? '';
      } else url = strip(tagText(b, 'link') ?? '') || strip(tagText(b, 'guid') ?? '');
      if (!title || !/^https?:\/\//.test(url)) return null;
      const body = tagText(b, isAtom ? 'summary' : 'description') ?? tagText(b, 'content') ?? tagText(b, 'content:encoded') ?? '';
      const enclosure = b.match(/<(?:enclosure|media:content|media:thumbnail)\b[^>]*>/i)?.[0];
      const imgInBody = decode(body).match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1];
      const summary = strip(body);
      return {
        title,
        url: decode(url),
        published: iso(tagText(b, isAtom ? 'updated' : 'pubDate') ?? tagText(b, 'published') ?? tagText(b, 'dc:date')),
        summary: summary ? clip(summary) : undefined,
        image: (enclosure && attr(enclosure, 'url')) || imgInBody || undefined,
      };
    })
    .filter((x): x is FeedItem => Boolean(x));
  return items.sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''));
}

/** Sports stories only, for a school feed that mixes in lunch menus and board notes. */
export const SPORTS_WORDS = /\b(football|basketball|baseball|softball|volleyball|soccer|wrestling|track|cross country|golf|tennis|swim|bowling|cheer|athlet|sectional|regional|state (meet|final|tournament)|conference|varsity|IHSA|signs? with|commit)/i;
export const sportsOnly = (items: readonly FeedItem[]) => items.filter((i) => SPORTS_WORDS.test(`${i.title} ${i.summary ?? ''}`));

/** Merge several feeds, dropping the same story syndicated twice. */
export function mergeFeeds(...lists: FeedItem[][]): FeedItem[] {
  const seen = new Set<string>();
  const key = (i: FeedItem) => i.title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '').slice(0, 60);
  return lists
    .flat()
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? ''))
    .filter((i) => (seen.has(key(i)) ? false : (seen.add(key(i)), true)));
}
