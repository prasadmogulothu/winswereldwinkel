// Loading and saving.
//
// Two homes, one set of endpoints:
//   - on the till PC, serve.ps1 answers these and writes data/products.json;
//     a backup is "copy the folder to a USB stick".
//   - on Vercel, serverless functions answer them and write to Blob storage.
// The UI never needs to know which one it is talking to.

let db = null;
let session = { admin: true, canSave: true };

export function all() { return db; }
export function products() { return db.products; }
export function categories() { return db.categories; }
export function getSession() { return session; }

export function byId(id) {
  return db.products.find(p => p.id === id) || null;
}

/** Thrown when the server says the session expired, so the UI can re-prompt. */
export class AuthError extends Error {}

async function fail(res) {
  let msg = `status ${res.status}`;
  try { msg = (await res.json()).error || msg; } catch { /* not JSON */ }
  return msg;
}

export async function loadSession() {
  try {
    const res = await fetch('/api/session', { cache: 'no-store' });
    if (res.ok) session = await res.json();
  } catch {
    // No session endpoint means the plain local server - treat as trusted.
    session = { admin: true, canSave: true };
  }
  return session;
}

export async function login(user, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, password })
  });
  if (!res.ok) throw new Error(await fail(res));
  await loadSession();
}

export async function logout() {
  await fetch('/api/session', { method: 'DELETE' });
  await loadSession();
}

export async function load() {
  const res = await fetch('/api/products', { cache: 'no-store' });
  if (!res.ok) throw new Error(await fail(res));
  db = await res.json();
  db.products.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  return db;
}

export async function save() {
  db.updated = new Date().toISOString().slice(0, 10);
  const res = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(db, null, 2)
  });
  if (res.status === 401) throw new AuthError('Sessie verlopen. Log opnieuw in.');
  if (!res.ok) throw new Error(await fail(res));
}

/** Informational only - Hanka holds the real turnover. */
export async function logSale(lines, totalCents) {
  const entry = {
    at: new Date().toISOString(),
    total: totalCents,
    lines: lines.map(l => ({ id: l.product.id, qty: l.qty, unit: l.product.unit, cents: l.cents }))
  };
  // A failed log must never block the counter, so this one swallows its error.
  try {
    await fetch('/api/sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  } catch (err) {
    console.warn('verkoop niet gelogd:', err);
  }
}

/** @returns {Promise<string|null>} a URL when the photo is stored remotely */
export async function savePhoto(id, blob) {
  const res = await fetch(`/api/photo?id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob
  });
  if (res.status === 401) throw new AuthError('Sessie verlopen. Log opnieuw in.');
  if (!res.ok) throw new Error(await fail(res));
  const out = await res.json().catch(() => ({}));
  return out.url || null;
}

export function nextSort() {
  return Math.max(0, ...db.products.map(p => p.sort ?? 0)) + 10;
}

/** "Zoete aardappel" -> "zoete-aardappel", used as both id and photo filename. */
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}
