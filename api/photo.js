import { requireAdmin } from './_lib.js';

// Photo upload for the hosted version. The 44 bundled photos are served
// statically from app/photos; anything uploaded here goes to Blob and the
// returned URL is stored on the product as photoUrl.
//
// POST /api/photo?id=tomaat   body: raw JPEG bytes
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return;

  const id = String(req.query.id || '');
  if (!/^[a-z0-9-]{1,60}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid id.' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({
      error: 'Photo upload is off: no Blob storage attached.'
    });
  }

  try {
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
      total += chunk.length;
      // The browser downscales to 400x400 before sending, so anything this
      // large is not a photo from our own admin screen.
      if (total > 2_000_000) {
        return res.status(413).json({ error: 'Photo too large.' });
      }
      chunks.push(chunk);
    }

    const { put } = await import('@vercel/blob');
    const blob = await put(`photos/${id}.jpg`, Buffer.concat(chunks), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'image/jpeg'
    });
    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('photo endpoint:', err);
    return res.status(500).json({ error: err.message });
  }
}
