// Stream pairing: links people paste turn into the right player or link.
// Run: npx tsx tools/streams.test.ts
import assert from 'node:assert/strict';
import { detectPlatform, playable, youtubeId } from '../lib/streams';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; } catch (e) { console.error('FAIL', name); throw e; }
};

test('youtube ids from every link shape', () => {
  for (const u of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/live/dQw4w9WgXcQ?si=x', 'https://m.youtube.com/shorts/dQw4w9WgXcQ']) {
    assert.equal(youtubeId(u), 'dQw4w9WgXcQ', u);
  }
  assert.equal(youtubeId('https://evil.example.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(youtubeId('not a url'), null);
});

test('platform detection', () => {
  assert.equal(detectPlatform('https://www.instagram.com/hillsboroilschools/live/'), 'instagram');
  assert.equal(detectPlatform('https://www.tiktok.com/@someone/live'), 'tiktok');
  assert.equal(detectPlatform('https://fb.watch/abc'), 'facebook');
  assert.equal(detectPlatform('https://twitch.tv/somechannel'), 'twitch');
  assert.equal(detectPlatform('https://example.com'), null);
});

test('embeds where the platform allows it, links where it does not', () => {
  assert.equal(playable({ platform: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', by: 'x' }, 'h').kind, 'iframe');
  assert.equal(playable({ platform: 'instagram', url: 'https://instagram.com/x/live', by: 'x' }, 'h').kind, 'link');
  assert.equal(playable({ platform: 'tiktok', url: 'https://tiktok.com/@x/live', by: 'x' }, 'h').kind, 'link');
  const tw = playable({ platform: 'twitch', url: 'https://twitch.tv/hhs_sports', by: 'x' }, 'varsityreach.example.com');
  assert.ok(tw.kind === 'iframe' && tw.src.includes('parent=varsityreach.example.com'));
  assert.equal(playable({ platform: 'twitch', url: 'https://twitch.tv/<script>', by: 'x' }, 'h').kind, 'link');
});

console.log(`streams: ${passed} passed`);
