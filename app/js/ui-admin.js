// Beheer - the owner's screen.
// Weekprijzen is the reason this module exists: forty prices in under a minute,
// instead of forty trips through Hanka's PLU editor.

import * as store from './store.js';
import { formatEuro, parseNumber } from './money.js';
import { t, plural, unit, pName, pSub, cName } from './i18n.js';
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

/** The session dropped mid-edit: back to the login form. */
function handleAuthLoss() {
  toast(t('admin.sessionLost'), 'err');
  render();
}

function go(next) {
  if (screen === 'week' && next !== 'week' && dirty.size) {
    toast(t('admin.unsaved'), 'err');
    return;
  }
  screen = next;
  render();
}

export function render() {
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
  const notice = store.getSession().canSave ? '' : readOnlyNotice();

  $('#admin-head').innerHTML = `
    <div>
      <div class="panel-title">${esc(t('admin.week'))}</div>
      <div class="panel-sub">${esc(t('admin.weekHint'))}</div>
    </div>`;

  $('#admin-body').innerHTML = list.length
    ? notice + `<div class="week">${list.map(p => `
        <label class="week-row">
          <span class="thumb">${photoMarkup(p)}</span>
          <span>
            <span class="week-name">${esc(pName(p))}</span>
            <span class="week-unit"> &middot; ${esc(t('sell.perUnit', { unit: unit(p.unit) }))}</span>
          </span>
          <span class="week-field">
            <span class="week-euro">&euro;</span>
            <input class="price-input" type="text" inputmode="decimal"
              data-id="${esc(p.id)}" value="${formatEuro(p.price)}"
              aria-label="${esc(t('admin.priceFor', { name: pName(p) }))}">
          </span>
        </label>`).join('')}</div>`
    : emptyState('leaf', t('admin.emptyTitle'), t('admin.emptyHint'));

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
      ${n ? `<span class="dirty-count">${esc(plural(n, 'admin.changed'))}</span>`
          : esc(t('admin.noChanges'))}
    </span>
    <span class="spacer"></span>
    ${n ? `<button class="btn btn-ghost btn-sm" id="btn-undo-week">${icon('undo')} ${esc(t('btn.restore'))}</button>` : ''}
    <button class="btn btn-primary btn-sm" id="btn-save-week" ${n ? '' : 'disabled'}>
      ${icon('save')} ${esc(t('btn.save'))}
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
    toast(plural(changed, 'admin.saved'), 'ok');
  } catch (err) {
    if (err instanceof store.AuthError) { await store.loadSession(); return handleAuthLoss(); }
    // Reload so the screen shows what is really stored, not what we hoped.
    toast(t('admin.saveFailed', { msg: err.message }), 'err');
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
      <div class="panel-title">${esc(t('admin.products'))}</div>
      <div class="panel-sub">${esc(t('admin.inList', { n: store.products().length }))}</div>
    </div>
    <span class="spacer"></span>
    <input class="search" id="admin-search" type="search"
      placeholder="${esc(t('admin.search'))}" aria-label="${esc(t('admin.search'))}">
    <button class="btn btn-primary btn-sm" id="btn-new">${icon('plus')} ${esc(t('admin.new'))}</button>`;

  $('#admin-foot').innerHTML = `<span class="panel-sub">${esc(t('admin.priceNote'))}</span>`;

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
      ? emptyState('search', t('admin.noResults', { q: query }), t('admin.noResultsHint'))
      : emptyState('leaf', t('admin.emptyTitle'), t('admin.emptyHint2'));
    return;
  }

  $('#admin-body').innerHTML = `
    <table class="table">
      <thead><tr>
        <th style="width:64px"></th><th>${esc(t('col.name'))}</th><th>${esc(t('col.category'))}</th>
        <th>${esc(t('col.unit'))}</th><th class="right">${esc(t('col.price'))}</th>
        <th>${esc(t('col.status'))}</th><th style="width:96px"></th>
      </tr></thead>
      <tbody>${list.map(p => `
        <tr>
          <td><span class="thumb">${photoMarkup(p)}</span></td>
          <td><div class="cell-nl">${esc(pName(p))}</div><div class="cell-en">${esc(pSub(p))}</div></td>
          <td>${esc(categoryName(p.category))}</td>
          <td>${esc(unit(p.unit))}</td>
          <td class="right num">&euro; ${formatEuro(p.price)}</td>
          <td><span class="pill ${p.active === false ? 'pill-off' : ''}">${esc(p.active === false ? t('status.off') : t('status.active'))}</span></td>
          <td>
            <div class="row-actions">
              <button class="line-remove" data-edit="${esc(p.id)}" aria-label="${esc(t('act.edit', { name: pName(p) }))}">${icon('pencil')}</button>
              <button class="line-remove" data-del="${esc(p.id)}" aria-label="${esc(t('act.delete', { name: pName(p) }))}">${icon('trash')}</button>
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
  const c = store.categories().find(x => x.id === id);
  return c ? cName(c) : id;
}

async function removeProduct(id) {
  const p = store.byId(id);
  const ok = await confirmDialog(
    t('del.title', { name: pName(p) }),
    t('del.text'),
    t('btn.delete')
  );
  if (!ok) return;

  const list = store.products();
  const at = list.indexOf(p);
  list.splice(at, 1);
  await persist();
  drawTable($('#admin-search')?.value || '');
  onChanged();

  toast(t('del.done', { name: pName(p) }), 'info', t('basket.undo'), async () => {
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
      <div class="panel-title">${isNew ? esc(t('form.newTitle')) : esc(pName(p))}</div>
      <div class="panel-sub">${esc(isNew ? t('form.newHint') : t('form.editHint'))}</div>
    </div>`;

  $('#admin-body').innerHTML = `
    <div class="form">
      <div class="field">
        <label for="f-nl">${esc(t('form.nameNl'))}</label>
        <input class="input" id="f-nl" value="${esc(p.nl)}" autocomplete="off">
        <div class="err" id="e-nl"></div>
      </div>
      <div class="field">
        <label for="f-en">${esc(t('form.nameEn'))}</label>
        <input class="input" id="f-en" value="${esc(p.en || '')}" autocomplete="off">
        <div class="hint">${esc(t('form.nameEnHint'))}</div>
      </div>

      <div class="field">
        <label for="f-cat">${esc(t('form.category'))}</label>
        <select class="select" id="f-cat">
          ${store.categories().map(c =>
            `<option value="${esc(c.id)}" ${c.id === p.category ? 'selected' : ''}>${esc(cName(c))}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="f-unit">${esc(t('form.unit'))}</label>
        <select class="select" id="f-unit">
          <option value="kg"   ${p.unit === 'kg' ? 'selected' : ''}>${esc(t('form.unitKg'))}</option>
          <option value="stuk" ${p.unit === 'stuk' ? 'selected' : ''}>${esc(t('form.unitStuk'))}</option>
          <option value="bos"  ${p.unit === 'bos' ? 'selected' : ''}>${esc(t('form.unitBos'))}</option>
        </select>
      </div>

      <div class="field">
        <label for="f-price">${esc(t('form.price'))}</label>
        <input class="input num" id="f-price" inputmode="decimal" value="${formatEuro(p.price)}">
        <div class="err" id="e-price"></div>
      </div>
      <div class="field">
        <label for="f-cost">${esc(t('form.cost'))}</label>
        <input class="input num" id="f-cost" inputmode="decimal" value="${p.cost == null ? '' : formatEuro(p.cost)}">
        <div class="hint" id="margin-hint">${esc(t('form.costHint'))}</div>
      </div>

      <div class="field field-wide">
        <label>${esc(t('form.photo'))}</label>
        <div class="photo-pick">
          <span class="thumb" id="f-thumb">${photoMarkup(p)}</span>
          <div>
            <input type="file" id="f-photo" accept="image/*" style="display:none">
            <button class="btn btn-ghost btn-sm" id="btn-photo">${icon('image')} ${esc(t('form.pickPhoto'))}</button>
            <div class="hint" style="margin-top:8px">${esc(t('form.photoHint'))}</div>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="switch" for="f-active">
          <input type="checkbox" id="f-active" ${p.active !== false ? 'checked' : ''}>
          <span>${esc(t('form.active'))}</span>
        </label>
      </div>
      <div class="field">
        <label for="f-sort">${esc(t('form.sort'))}</label>
        <input class="input num" id="f-sort" inputmode="numeric" value="${p.sort ?? 0}">
        <div class="hint">${esc(t('form.sortHint'))}</div>
      </div>
    </div>`;

  $('#admin-foot').innerHTML = `
    <button class="btn btn-ghost btn-sm" id="btn-cancel">${icon('back')} ${esc(t('btn.back'))}</button>
    <span class="spacer"></span>
    <button class="btn btn-primary btn-sm" id="btn-save">${icon('save')} ${esc(t('btn.save'))}</button>`;

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
    hint.textContent = t('form.margin', { pct: Math.round(((price - cost) / cost) * 100) });
  } else {
    hint.textContent = t('form.costHint');
  }
}

/** Downscale to 400x400 in the browser so we never send a 4 MB phone photo. */
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
    toast(t('form.photoFailed', { msg: err.message }), 'err');
  }
}

async function saveProduct() {
  const nl = $('#f-nl').value.trim();
  const price = toCents($('#f-price').value);
  const costRaw = $('#f-cost').value.trim();
  const cost = costRaw ? toCents(costRaw) : null;

  $('#e-nl').textContent = nl ? '' : t('form.needName');
  $('#e-price').textContent = price === null ? t('form.needPrice') : '';
  $('#f-nl').setAttribute('aria-invalid', String(!nl));
  $('#f-price').setAttribute('aria-invalid', String(price === null));
  if (!nl || price === null) {
    (!nl ? $('#f-nl') : $('#f-price')).focus();
    return;
  }
  if (costRaw && cost === null) {
    toast(t('form.badCost'), 'err');
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
    toast(t('form.savedOk', { name: nl }), 'ok');
    editing = null;
    screen = 'products';
    render();
    onChanged();
  } catch (err) {
    if (err instanceof store.AuthError) { await store.loadSession(); return handleAuthLoss(); }
    toast(t('admin.saveFailed', { msg: err.message }), 'err');
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
