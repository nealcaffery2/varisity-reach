// GENERATED from lib/ by tools/sync-functions.ts. Edit the lib/ copy, then run `pnpm sync:functions`.
// Gold card tokens: the QR on a supporter's phone. A token is
// base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload)). The real
// signing key lives only in the gold-card edge functions (GOLD_CARD_SECRET);
// a merchant's scan goes to gold-card-verify, so the key never ships to a
// browser. Demo mode signs with a public demo key and says so on the card.

export type CardPayload = { school: string; holder: string; season: string; exp: string; n: string };

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

export async function sign(payload: CardPayload, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

export type VerifyResult = { ok: true; payload: CardPayload; demo?: boolean } | { ok: false; reason: string };

export async function verify(token: string, secret: string, today = new Date()): Promise<VerifyResult> {
  const [body, sig] = token.trim().split('.');
  if (!body || !sig) return { ok: false, reason: 'That is not a gold card code.' };
  const expected = b64url(await hmac(secret, body));
  // Constant-time compare.
  if (expected.length !== sig.length || [...expected].reduce((d, c, i) => d | (c.charCodeAt(0) ^ sig.charCodeAt(i)), 0) !== 0) {
    return { ok: false, reason: 'This card did not come from Varsity Reach. Do not honor it.' };
  }
  let payload: CardPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  } catch {
    return { ok: false, reason: 'The card code is damaged. Ask the holder to reopen it.' };
  }
  if (payload.exp < today.toISOString().slice(0, 10)) return { ok: false, reason: `This card expired on ${payload.exp}.` };
  return { ok: true, payload };
}

/** Demo only. Anyone can read this key, which is why demo cards say DEMO on them. */
export const DEMO_KEY = 'varsity-reach-demo-key-not-secret';
export const demoSign = (p: CardPayload) => sign(p, DEMO_KEY);
export const demoVerify = async (token: string): Promise<VerifyResult> => {
  const r = await verify(token, DEMO_KEY);
  return r.ok ? { ...r, demo: true } : r;
};
