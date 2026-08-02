import { checkLogin, makeToken, setSessionCookie } from './_lib.js';

// Crude in-memory throttle. Serverless instances are short-lived and not
// shared, so this slows a casual guesser and nothing more - it is not a
// defence against a determined attacker.
// ponytail: good enough for a shop price list; use a KV-backed counter if this
// ever guards anything that matters.
const attempts = new Map();
const WINDOW_MS = 60_000;
const MAX_TRIES = 8;

function tooManyTries(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now - rec.first > WINDOW_MS) {
    attempts.set(ip, { first: now, n: 1 });
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_TRIES;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode niet toegestaan' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'onbekend';
  if (tooManyTries(ip)) {
    return res.status(429).json({ error: 'Te veel pogingen. Wacht een minuut.' });
  }

  const { user, password } = req.body ?? {};
  if (!checkLogin(user, password)) {
    // One message for both cases, so it never reveals which half was wrong.
    return res.status(401).json({ error: 'Gebruikersnaam of wachtwoord klopt niet.' });
  }

  attempts.delete(ip);
  setSessionCookie(res, makeToken());
  return res.status(200).json({ ok: true });
}
