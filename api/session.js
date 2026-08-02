import { isAdmin, clearSessionCookie } from './_lib.js';

// GET  -> is this browser logged in, and can it actually save?
// DELETE -> log out
export default function handler(req, res) {
  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode niet toegestaan' });
  }
  return res.status(200).json({
    admin: isAdmin(req),
    // The admin screen uses this to warn up front instead of failing on save.
    canSave: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  });
}
