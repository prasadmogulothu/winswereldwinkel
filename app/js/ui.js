// Small shared helpers. Deliberately not a framework.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escape text going into innerHTML. Product names are typed by the owner. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Markup for one of the inlined Lucide symbols. */
export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

/**
 * Photo, or a tile in the vegetable's own colour with its initial.
 * Never an empty box - a blank tile is unreadable at a glance, which is the
 * one thing the sell screen cannot afford.
 */
export function photoMarkup(p) {
  const initial = esc((p.nl || '?').trim()[0].toUpperCase());
  const fallback =
    `<div class="tile-fallback" style="background:${esc(p.color || '#3A444C')}">${initial}</div>`;
  // photoUrl is set when the photo was uploaded to Blob on the hosted version;
  // otherwise it is one of the 44 bundled files.
  const src = p.photoUrl || `photos/${encodeURIComponent(p.id)}.jpg`;
  // Not lazy-loaded: the whole set is ~2 MB, so lazy loading only buys a
  // visible flash of the fallback at the counter.
  return `${fallback}<img src="${esc(src)}" alt="" onerror="this.remove()">`;
}

let toastSeq = 0;

/** @param {'ok'|'err'|'info'} kind */
export function toast(message, kind = 'info', actionLabel, onAction) {
  const stack = $('#toasts');
  const el = document.createElement('div');
  const id = ++toastSeq;
  el.className = `toast toast-${kind}`;
  el.setAttribute('role', kind === 'err' ? 'alert' : 'status');
  el.innerHTML =
    icon(kind === 'ok' ? 'check' : kind === 'err' ? 'alert' : 'leaf') +
    `<span>${esc(message)}</span>`;

  if (actionLabel) {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost btn-sm';
    b.textContent = actionLabel;
    b.onclick = () => { onAction?.(); el.remove(); };
    el.appendChild(b);
  }

  stack.appendChild(el);
  // Errors stay long enough to read and act on; confirmations get out of the way.
  setTimeout(() => el.remove(), kind === 'err' ? 7000 : actionLabel ? 8000 : 3000);
  return id;
}

/** Native <dialog>, so Esc and focus trapping come free. */
export function confirmDialog(title, text, okLabel) {
  const dlg = $('#confirm');
  $('#confirm-title').textContent = title;
  $('#confirm-text').textContent = text;
  $('#confirm-yes').textContent = okLabel;
  dlg.showModal();
  return new Promise(resolve => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true });
  });
}

export function emptyState(iconName, title, hint) {
  return `<div class="empty">${icon(iconName, 'icon')}
    <div class="empty-title">${esc(title)}</div>
    <div>${esc(hint)}</div></div>`;
}
