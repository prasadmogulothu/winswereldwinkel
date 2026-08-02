// Beheer - the owner's screen.
// Weekprijzen is the reason this module exists: forty prices in under a minute,
// instead of forty trips through Hanka's PLU editor.

import * as store from './store.js';
import { formatEuro, parseNumber, UNIT_LABEL } from './money.js';
import { $, $$, esc, icon, photoMarkup, toast, confirmDialog, emptyState } from './ui.js';
import { renderLogin, readOnlyNotice } from './ui-login.js';

let screen = 'week';        // 'week' | 'products' | 'edit'
let editing = null;         // product being edited, or a fresh draft
let dirty = new Map();      // id -> new price in cents
let onChanged = () => {};   // tells the sell screen to redraw

export function init(changedCallback) {
  onChanged = changedCallback;
  $('#nav-week').onclick = () => go('week');
  $('#nav-products').onclick = () => go('products');
  render();
}

/** The session dropped mid-edit: back to the login form, keep the work visible. */
function handleAuthLoss() {
  toast('Sessie verlopen. Log opnieuw in.', 'err');
  render();
}

function go(next) {
  if (screen === 'week' && next !== 'week' && dirty.size) {
    toast('Je hebt niet-opgeslagen prijzen. Sla eerst op.', 'err');
    return;
  }
  screen = next;
  render();
}

function render() {
  // Not logged in? Nothing of the admin is drawn at all.
  if (!store.getSession().admin) {
    $('#view-admin').classList.add('is-locked');
    renderLogin(() => {
      $('#view-admin').classList.remove('is-locked');
      screen = 'week';
      render();
    });
    return;
  }
  $('#view-admin').classList.remove('is-locked');

  $('#nav-week').setAttribute('aria-pressed', String(screen === 'week'));
  $('#nav-products').setAttribute('aria-pressed', String(screen !== 'week'));
  if (screen === 'week') renderWeek();
  else if (screen === 'products') renderProducts();
  else renderEdit();
}

// =========================================================================
// Weekprijzen
// =========================================================================

function renderWeek() {
  const list = store.products().filter(p => p.active !== false);

  $('#admin-head').innerHTML = `
    <div>
      <div class="panel-title">Weekprijzen</div>
      <div class="panel-sub">Tab of Enter om naar de volgende te springen. Prijzen zijn inclusief btw.</div>
    </div>`;

  const notice = store.getSession().canSave ? '' : readOnlyNotice();

  $('#admin-body').innerHTML = list.length
    ? notice + `<div class="week">${list.map(p => `
        <label class="week-row">
          <span class="thumb">${photoMarkup(p)}</span>
          <span>
            <span class="week-name">${esc(p.nl)}</span>
            <span class="week-unit"> &middot; per ${esc(UNIT_LABEL[p.unit] || p.unit)}</span>
          </span>
          <span class="week-field">
            <span class="week-euro">&euro;</span>
            <input class="price-input" type="text" inputmode="decimal"
              data-id="${esc(p.id)}" value="${formatEuro(p.price)}"
              aria-label="Prijs voor ${esc(p.nl)}">
          </span>
        </label>`).join('')}</div>`
    : emptyState('leaf', 'Nog geen groenten',
        'Ga naar Alle groenten en voeg de eerste toe.');

  renderWeekFoot();

  $$('#admin-body .price-input').forEach(inp => {
    inp.addEventListener('input', () => markDirty(inp));
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const all = $$('#admin-body .price-input');
      const next = all[all.indexOf(inp) + 1];
      next ? next.focus() : $('#btn-save-week')?.focus();
    });
  });
}

function markDirty(inp) {
  const p = store.byId(inp.dataset.id);
  const cents = toCents(inp.value);
  const bad = cents === null;

  inp.setAttribute('aria-invalid', String(bad));
  if (bad || cents === p.price) dirty.delete(p.id);
  else dirty.set(p.id, cents);

  inp.classList.toggle('is-dirty', dirty.has(p.id));
  renderWeekFoot();
}

/** "3,80" / "3.80" / "3,8" / "4" -> integer cents. null if it is not a price. */
function toCents(text) {
  const n = parseNumber(text);
  if (!isFinite(n) || n < 0 || n > 9999) return null;
  return Math.round(n * 100);
}

function renderWeekFoot() {
  const n = dirty.size;
  $('#admin-foot').innerHTML = `
    <span class="panel-sub">
      ${n ? `<span class="dirty-count">${n} ${n === 1 ? 'prijs' : 'prijzen'} gewijzigd</span>`
          : 'Geen wijzigingen'}
    </span>
    <span class="spacer"></span>
    ${n ? `<button class="btn btn-ghost btn-sm" id="btn-undo-week">${icon('undo')} Herstellen</button>` : ''}
    <button class="btn btn-primary btn-sm" id="btn-save-week" ${n ? '' : 'disabled'}>
      ${icon('save')} Opslaan
    </button>`;

  const save = $('#btn-save-week');
  if (save) save.onclick = saveWeek;
  const undo = $('#btn-undo-week');
  if (undo) undo.onclick = () => { dirty.clear(); renderWeek(); };
}

async function saveWeek() {
  const changed = dirty.size;
  for (const [id, cents] of dirty) store.byId(id).price = cents;
  try {
    await store.save();
    dirty.clear();
    renderWeek();
    onChanged();
    toast(`${changed} ${changed === 1 ? 'prijs' : 'prijzen'} opgeslagen`, 'ok');
  } catch (err) {
    if (err instanceof store.AuthError) { await store.loadSession(); return handleAuthLoss(); }
    // Reload so the screen shows what is really stored, not what we hoped.
    toast(`Opslaan mislukt: ${err.message}`, 'err');
    await store.load();
    dirty.clear();
    renderWeek();
  }
}

// =========================================================================
// Alle groenten
// =========================================================================

function renderProducts() {
  $('#admin-head').innerHTML = `
    <div>
      <div class="panel-title">Alle groenten</div>
      <div class="panel-sub">${store.products().length} in de lijst</div>
    </div>
    <span class="spacer"></span>
    <input class="search" id="admin-search" type="search" placeholder="Zoeken..." aria-label="Zoeken">
    <button class="btn btn-primary btn-sm" id="btn-new">${icon('plus')} Nieuwe groente</button>`;

  $('#admin-foot').innerHTML =
    `<span class="panel-sub">Prijzen zijn consumentenprijzen inclusief btw, precies zoals je ze in Hanka typt.</span>`;

  drawTable('');

  $('#btn-new').onclick = () => {
    editing = {
      id: '', nl: '', en: '', category: store.categories()[0].id, unit: 'kg',
      price: 0, cost: null, active: true, sort: store.nextSort(), color: '#3A444C'
    };
    screen = 'edit';
    render();
  };
  $('#admin-search').addEventListener('input', e => drawTable(e.target.value));
}

function drawTable(query) {
  const q = query.trim().toLowerCase();
  const list = store.products().filter(p =>
    !q || p.nl.toLowerCase().includes(q) || (p.en || '').toLowerCase().includes(q));

  if (!list.length) {
    $('#admin-body').innerHTML = q
      ? emptyState('search', `Niets gevonden voor "${query}"`, 'Probeer een ander woord.')
      : emptyState('leaf', 'Nog geen groenten', 'Klik op Nieuwe groente om te beginnen.');
    return;
  }

  $('#admin-body').innerHTML = `
    <table class="table">
      <thead><tr>
        <th style="width:64px"></th><th>Naam</th><th>Categorie</th><th>Eenheid</th>
        <th class="right">Prijs</th><th>Status</th><th style="width:96px"></th>
      </tr></thead>
      <tbody>${list.map(p => `
        <tr>
          <td><span class="thumb">${photoMarkup(p)}</span></td>
          <td><div class="cell-nl">${esc(p.nl)}</div><div class="cell-en">${esc(p.en || '')}</div></td>
          <td>${esc(categoryName(p.category))}</td>
          <td>${esc(UNIT_LABEL[p.unit] || p.unit)}</td>
          <td class="right num">&euro; ${formatEuro(p.price)}</td>
          <td><span class="pill ${p.active === false ? 'pill-off' : ''}">${p.active === false ? 'uit' : 'actief'}</span></td>
          <td>
            <div class="row-actions">
              <button class="line-remove" data-edit="${esc(p.id)}" aria-label="${esc(p.nl)} bewerken">${icon('pencil')}</button>
              <button class="line-remove" data-del="${esc(p.id)}" aria-label="${esc(p.nl)} verwijderen">${icon('trash')}</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;

  $('#admin-body').onclick = e => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { editing = { ...store.byId(ed.dataset.edit) }; screen = 'edit'; render(); return; }
    const del = e.target.closest('[data-del]');
    if (del) removeProduct(del.dataset.del);
  };
}

function categoryName(id) {
  return store.categories().find(c => c.id === id)?.nl || id;
}

async function removeProduct(id) {
  const p = store.byId(id);
  const ok = await confirmDialog(
    `${p.nl} verwijderen?`,
    'De groente verdwijnt uit het verkoopscherm en van de prijslijst. Je kunt dit direct daarna nog ongedaan maken.'
  );
  if (!ok) return;

  const list = store.products();
  const at = list.indexOf(p);
  list.splice(at, 1);
  await persist();
  drawTable($('#admin-search')?.value || '');
  onChanged();

  toast(`${p.nl} verwijderd`, 'info', 'Ongedaan maken', async () => {
    list.splice(at, 0, p);
    await persist();
    drawTable($('#admin-search')?.value || '');
    onChanged();
  });
}

// =========================================================================
// Toevoegen / bewerken
// =========================================================================

function renderEdit() {
  const p = editing;
  const isNew = !p.id;

  $('#admin-head').innerHTML = `
    <div>
      <div class="panel-title">${isNew ? 'Nieuwe groente' : esc(p.nl)}</div>
      <div class="panel-sub">${isNew ? 'Vul in wat op het schap staat.' : 'Wijzigingen gelden direct aan de kassa.'}</div>
    </div>`;

  $('#admin-body').innerHTML = `
    <div class="form">
      <div class="field">
        <label for="f-nl">Naam (Nederlands)</label>
        <input class="input" id="f-nl" value="${esc(p.nl)}" autocomplete="off">
        <div class="err" id="e-nl"></div>
      </div>
      <div class="field">
        <label for="f-en">Naam (Engels)</label>
        <input class="input" id="f-en" value="${esc(p.en || '')}" autocomplete="off">
        <div class="hint">Staat onder de Nederlandse naam op de tegel en op de prijslijst.</div>
      </div>

      <div class="field">
        <label for="f-cat">Categorie</label>
        <select class="select" id="f-cat">
          ${store.categories().map(c =>
            `<option value="${esc(c.id)}" ${c.id === p.category ? 'selected' : ''}>${esc(c.nl)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="f-unit">Eenheid</label>
        <select class="select" id="f-unit">
          <option value="kg"   ${p.unit === 'kg' ? 'selected' : ''}>per kg — wegen</option>
          <option value="stuk" ${p.unit === 'stuk' ? 'selected' : ''}>per stuk — tellen</option>
          <option value="bos"  ${p.unit === 'bos' ? 'selected' : ''}>per bos — tellen</option>
        </select>
      </div>

      <div class="field">
        <label for="f-price">Verkoopprijs (&euro;, incl. btw)</label>
        <input class="input num" id="f-price" inputmode="decimal" value="${formatEuro(p.price)}">
        <div class="err" id="e-price"></div>
      </div>
      <div class="field">
        <label for="f-cost">Inkoopprijs (&euro;, optioneel)</label>
        <input class="input num" id="f-cost" inputmode="decimal" value="${p.cost == null ? '' : formatEuro(p.cost)}">
        <div class="hint" id="margin-hint">Alleen ter informatie — wordt nergens mee gerekend.</div>
      </div>

      <div class="field field-wide">
        <label>Foto</label>
        <div class="photo-pick">
          <span class="thumb" id="f-thumb">${photoMarkup(p)}</span>
          <div>
            <input type="file" id="f-photo" accept="image/*" style="display:none">
            <button class="btn btn-ghost btn-sm" id="btn-photo">${icon('image')} Foto kiezen</button>
            <div class="hint" style="margin-top:8px">Een telefoonfoto is prima. Wordt vierkant bijgesneden.</div>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="switch" for="f-active">
          <input type="checkbox" id="f-active" ${p.active !== false ? 'checked' : ''}>
          <span>Actief — zichtbaar aan de kassa</span>
        </label>
      </div>
      <div class="field">
        <label for="f-sort">Volgorde</label>
        <input class="input num" id="f-sort" inputmode="numeric" value="${p.sort ?? 0}">
        <div class="hint">Lager staat vooraan in het verkoopscherm.</div>
      </div>
    </div>`;

  $('#admin-foot').innerHTML = `
    <button class="btn btn-ghost btn-sm" id="btn-cancel">${icon('back')} Terug</button>
    <span class="spacer"></span>
    <button class="btn btn-primary btn-sm" id="btn-save">${icon('save')} Opslaan</button>`;

  $('#btn-cancel').onclick = () => { editing = null; screen = 'products'; render(); };
  $('#btn-save').onclick = saveProduct;
  $('#btn-photo').onclick = () => $('#f-photo').click();
  $('#f-photo').onchange = e => pickPhoto(e.target.files[0]);
  $('#f-cost').addEventListener('input', updateMargin);
  $('#f-price').addEventListener('input', updateMargin);
  updateMargin();
  $('#f-nl').focus();
}

function updateMargin() {
  const price = toCents($('#f-price').value);
  const cost = $('#f-cost').value.trim() ? toCents($('#f-cost').value) : null;
  const hint = $('#margin-hint');
  if (price && cost && cost > 0) {
    const pct = Math.round(((price - cost) / cost) * 100);
    hint.textContent = `Marge ${pct}% — alleen ter informatie, wordt nergens mee gerekend.`;
  } else {
    hint.textContent = 'Alleen ter informatie — wordt nergens mee gerekend.';
  }
}

/** Downscale to 400x400 in the browser so we never write a 4 MB phone photo. */
async function pickPhoto(file) {
  if (!file) return;
  try {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 400;
    canvas.getContext('2d').drawImage(
      bitmap,
      (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side,
      0, 0, 400, 400
    );
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
    editing._photoBlob = blob;
    $('#f-thumb').innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="">`;
  } catch (err) {
    toast(`Foto lukte niet: ${err.message}`, 'err');
  }
}

async function saveProduct() {
  const nl = $('#f-nl').value.trim();
  const price = toCents($('#f-price').value);
  const costRaw = $('#f-cost').value.trim();
  const cost = costRaw ? toCents(costRaw) : null;

  $('#e-nl').textContent = nl ? '' : 'Vul een Nederlandse naam in.';
  $('#e-price').textContent = price === null ? 'Vul een prijs in, bijvoorbeeld 3,80.' : '';
  $('#f-nl').setAttribute('aria-invalid', String(!nl));
  $('#f-price').setAttribute('aria-invalid', String(price === null));
  if (!nl || price === null) {
    (!nl ? $('#f-nl') : $('#f-price')).focus();
    return;
  }
  if (costRaw && cost === null) {
    toast('Inkoopprijs is geen geldig bedrag.', 'err');
    return;
  }

  const p = editing;
  const isNew = !p.id;
  if (isNew) {
    p.id = uniqueId(store.slugify(nl));
    p.color = p.color || '#3A444C';
  }
  Object.assign(p, {
    nl,
    en: $('#f-en').value.trim(),
    category: $('#f-cat').value,
    unit: $('#f-unit').value,
    price, cost,
    active: $('#f-active').checked,
    sort: Number($('#f-sort').value) || 0
  });

  if (isNew) store.products().push(p);
  else Object.assign(store.byId(p.id), p);

  try {
    if (p._photoBlob) {
      const url = await store.savePhoto(p.id, p._photoBlob);
      // Hosted uploads come back with a Blob URL; locally the file is served
      // straight from app\photos and there is nothing to remember.
      if (url) p.photoUrl = url;
      delete p._photoBlob;
      Object.assign(store.byId(p.id), { photoUrl: p.photoUrl });
    }
    await persist();
    toast(`${nl} opgeslagen`, 'ok');
    editing = null;
    screen = 'products';
    render();
    onChanged();
  } catch (err) {
    if (err instanceof store.AuthError) { await store.loadSession(); return handleAuthLoss(); }
    toast(`Opslaan mislukt: ${err.message}`, 'err');
  }
}

function uniqueId(base) {
  let id = base || 'groente';
  let n = 2;
  while (store.byId(id)) id = `${base}-${n++}`;
  return id;
}

async function persist() {
  store.products().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  await store.save();
}
