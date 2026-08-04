import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from './_lib.js';

// Vercel's filesystem is read-only, so the price list lives in Vercel Blob.
// Without a Blob token the site still works - it just serves the price list
// committed to the repo and refuses to save.
//
// Every save writes a NEW pathname rather than overwriting one. Public blob
// URLs sit behind a CDN with a 60 second floor on cache lifetime, so
// overwriting a fixed name meant a price saved at 10:00 could still read back
// as the old one at 10:00:30. A fresh name is a fresh URL, so a saved price is
// visible immediately. The last few versions are kept as a cheap undo.
const PREFIX = 'prijslijst/products-';
const KEEP = 5;

const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** JSON.parse rejects a UTF-8 BOM, and Windows editors love adding one. */
function parseJson(text) {
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

async function readSeed() {
  const file = path.join(process.cwd(), 'data', 'products.json');
  return parseJson(await readFile(file, 'utf8'));
}

/** Newest first. */
async function versions() {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: PREFIX });
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');

      if (hasBlob()) {
        const [newest] = await versions();
        if (newest) {
          const r = await fetch(newest.url, { cache: 'no-store' });
          if (r.ok) return res.status(200).json(parseJson(await r.text()));
        }
      }
      // Nothing saved yet: serve the list that shipped with the repo.
      return res.status(200).json(await readSeed());
    }

    if (req.method === 'PUT') {
      if (!requireAdmin(req, res)) return;

      if (!hasBlob()) {
        return res.status(501).json({
          error: 'Saving is off: no Blob storage is attached. ' +
                 'Add a Blob store in Vercel (BLOB_READ_WRITE_TOKEN) and deploy again.'
        });
      }

      const body = req.body;
      // Validate before writing: a malformed body must never replace the price
      // list, same rule as the till version.
      if (!body || !Array.isArray(body.products) || !Array.isArray(body.categories)) {
        return res.status(400).json({ error: 'Invalid price list - not saved.' });
      }
      if (body.products.length === 0) {
        return res.status(400).json({ error: 'Empty price list - not saved.' });
      }

      const { put, del } = await import('@vercel/blob');
      await put(`${PREFIX}${Date.now()}.json`, JSON.stringify(body, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json'
      });

      // Prune, but never let tidying up break a successful save.
      try {
        const old = (await versions()).slice(KEEP);
        if (old.length) await del(old.map(b => b.url));
      } catch (err) {
        console.warn('pruning old versions failed:', err.message);
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('products endpoint:', err);
    return res.status(500).json({ error: err.message });
  }
}
