// Shared bits for the Vercel functions: login check and session cookie.
//
// The gate that matters is on the WRITE endpoint, not in the browser. A client
// side password check is bypassed by opening devtools, so every function that
// changes prices calls requireAdmin() itself.

import crypto from 'node:crypto';

export const ADMIN_USER = process.env.ADMIN_USER || 'admin';

// Set ADMIN_PASSWORD in the Vercel project so the real password is not in the
// repo. The literal below only exists so the very first deploy works.
const PASSWORD = process.env.ADMIN_PASSWORD || 'RaguWinkel';

// Rotating SESSION_SECRET logs everyone out, which is the point.
const SECRET = process.env.SESSION_SECRET || `${PASSWORD}::groenten-session`;

export const COOKIE = 'groenten_admin';
const MAX_AGE = 60 * 60 * 12; // twaalf uur - een werkdag

/** Compare without leaking length or position through timing. */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function checkLogin(user, password) {
  // Both compared, both constant time - otherwise the username becomes an oracle.
  const okUser = safeEqual(user ?? '', ADMIN_USER);
  const okPass = safeEqual(password ?? '', PASSWORD);
  return okUser && okPass;
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [exp, mac] = token.split('.', 2);
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(mac, sign(exp));
}

export function readCookie(req, name) {
  const raw = req.headers?.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

export function isAdmin(req) {
  return verifyToken(readCookie(req, COOKIE));
}

/** @returns {boolean} true if the request may continue */
export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: 'Niet ingelogd. Log opnieuw in.' });
  return false;
}

export function setSessionCookie(res, token) {
  const bits = [
    `${COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Secure',
    `Max-Age=${MAX_AGE}`
  ];
  res.setHeader('Set-Cookie', bits.join('; '));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`);
}
