import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from './_lib.js';

// Vercel's filesystem is read-only, so the price list lives in Vercel Blob.
// Without a Blob token the site still works - it just serves the price list
// that was committed to the repo and refuses to save.
const KEY = 'products.json';
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function readSeed() {
  const file = path.join(process.cwd(), 'data', 'products.json');
  return JSON.parse(await readFile(file, 'utf8'));
}

async function blobUrl() {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: KEY, limit: 1 });
  const hit = blobs.find(b => b.pathname === KEY);
  return hit ? hit.url : null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (hasBlob()) {
        const url = await blobUrl();
        if (url) {
          // Stable blob URLs sit behind a CDN, so bust it - a price the owner
          // just saved has to be the price the counter sees.
          const r = await fetch(`${url}?ts=${Date.now()}`, { cache: 'no-store' });
          if (r.ok) {
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(await r.json());
          }
        }
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(await readSeed());
    }

    if (req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;

      if (!hasBlob()) {
        return res.status(501).json({
          error: 'Opslaan staat uit: er is geen Blob-opslag gekoppeld. ' +
                 'Voeg in Vercel een Blob store toe (BLOB_READ_WRITE_TOKEN) en deploy opnieuw.'
        });
      }

      const body = req.body;
      // Validate before writing: a malformed body must never replace the price
      // list, same rule as the till version.
      if (!body || !Array.isArray(body.products) || !Array.isArray(body.categories)) {
        return res.status(400).json({ error: 'Ongeldige prijslijst - niet opgeslagen.' });
      }

      const { put } = await import('@vercel/blob');
      await put(KEY, JSON.stringify(body, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Methode niet toegestaan' });
  } catch (err) {
    console.error('products endpoint:', err);
    return res.status(500).json({ error: err.message });
  }
}
