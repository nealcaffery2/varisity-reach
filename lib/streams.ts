// Pairing a livestream with a game. YouTube, Facebook and Twitch publish
// embeddable players, so the stream plays inside the game page next to the
// scoreboard. Instagram Live and TikTok LIVE do not offer embeds for live
// video, so those pair as a link out, and the streamer gets the scoreboard
// the other way round: the /overlay page as a browser source in OBS,
// Streamlabs or Prism, which puts the community score on their stream.

export type StreamPlatform = 'youtube' | 'facebook' | 'twitch' | 'instagram' | 'tiktok' | 'file';

export type Stream = {
  platform: StreamPlatform;
  url: string;
  /** Who is streaming, as shown on the page. */
  by: string;
  verified?: boolean;
};

export type Playable =
  | { kind: 'iframe'; src: string; title: string }
  | { kind: 'video'; src: string }
  | { kind: 'link'; href: string; label: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return YT_ID.test(u.pathname.slice(1)) ? u.pathname.slice(1) : null;
    if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null;
    const v = u.searchParams.get('v');
    if (v && YT_ID.test(v)) return v;
    const m = u.pathname.match(/^\/(?:live|shorts|embed)\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Detect the platform from a pasted link. */
export function detectPlatform(url: string): StreamPlatform | null {
  try {
    const host = new URL(url).hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
    if (host.endsWith('facebook.com') || host === 'fb.watch') return 'facebook';
    if (host.endsWith('twitch.tv')) return 'twitch';
    if (host.endsWith('instagram.com')) return 'instagram';
    if (host.endsWith('tiktok.com')) return 'tiktok';
    return null;
  } catch {
    return null;
  }
}

export const PLATFORM_NAME: Record<StreamPlatform, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook Live',
  twitch: 'Twitch',
  instagram: 'Instagram Live',
  tiktok: 'TikTok LIVE',
  file: 'Clip',
};

/** How to show a stream on the game page. `host` is the page's hostname, which Twitch requires. */
export function playable(s: Stream, host: string): Playable {
  switch (s.platform) {
    case 'youtube': {
      const id = youtubeId(s.url);
      return id
        ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1`, title: `YouTube stream by ${s.by}` }
        : { kind: 'link', href: s.url, label: 'Watch on YouTube' };
    }
    case 'facebook':
      return { kind: 'iframe', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(s.url)}&show_text=false&autoplay=true&mute=true`, title: `Facebook Live stream by ${s.by}` };
    case 'twitch': {
      const channel = (() => {
        try { return new URL(s.url).pathname.split('/').filter(Boolean)[0] ?? ''; } catch { return ''; }
      })();
      return /^[A-Za-z0-9_]{3,25}$/.test(channel)
        ? { kind: 'iframe', src: `https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true`, title: `Twitch stream by ${s.by}` }
        : { kind: 'link', href: s.url, label: 'Watch on Twitch' };
    }
    case 'instagram':
      return { kind: 'link', href: s.url, label: 'Watch on Instagram' };
    case 'tiktok':
      return { kind: 'link', href: s.url, label: 'Watch on TikTok' };
    case 'file':
      return { kind: 'video', src: s.url };
  }
}
