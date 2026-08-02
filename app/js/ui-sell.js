// Verkoop - the counter screen.
// Job: from "customer put a bag of okra down" to "a number I type into Hanka"
// in under five seconds, with no chance of picking the wrong vegetable.

import * as store from './store.js';
import {
  lineTotal, basketTotal, formatEuro, formatQty, checkWeight,
  isWeighed, parseNumber, UNIT_LABEL
} from './money.js';
import { $, $$, esc, icon, photoMarkup, toast, emptyState } from './ui.js';

let category = 'alles';
let current = null;   // product being weighed
let typed = '';       // raw keypad string, e.g. "2.61"
let basket = [];      // { product, qty, cents }

export function init() {
  renderRail();
  renderGrid();
  renderBasket();

  $('#rail').addEventListener('click', e => {
    const b = e.target.closest('.rail-btn');
    if (!b) return;
    category = b.dataset.cat;
    renderRail();
    renderGrid();
  });

  $('#product-grid').addEventListener('click', e => {
    const t = e.target.closest('.tile');
    if (t) openWeigh(t.dataset.id);
  });

  $('#keypad').addEventListener('click', e => {
    const k = e.target.closest('.key');
    if (k) press(k.dataset.k);
  });

  $('#btn-weigh-back').onclick = closeWeigh;
  $('#btn-add').onclick = addLine;
  $('#btn-done').onclick = finish;
  $('#btn-clear').onclick = clearBasket;

  $('#basket-lines').addEventListener('click', e => {
    const r = e.target.closest('.line-remove');
    if (r) removeLine(Number(r.dataset.i));
    const p = e.target.closest('.line-print');
    if (p) printSticker(basket[Number(p.dataset.i)]);
  });

  // The till has a keyboard next to it and some staff prefer it.
  document.addEventListener('keydown', onKey);
}

/** Called when the admin changes products, so the grid never goes stale. */
export function refresh() {
  renderRail();
  renderGrid();
}

// --- category rail --------------------------------------------------------

function renderRail() {
  const cats = [{ id: 'alles', nl: 'Alles' }, ...store.categories()];
  $('#rail').innerHTML = cats.map(c => `
    <button class="rail-btn" data-cat="${esc(c.id)}"
      aria-pressed="${c.id === category}">${esc(c.nl)}</button>`).join('');
}

// --- tile grid ------------------------------------------------------------

function visibleProducts() {
  return store.products().filter(p =>
    p.active !== false && (category === 'alles' || p.category === category));
}

function renderGrid() {
  const list = visibleProducts();
  const grid = $('#product-grid');

  if (!list.length) {
    grid.innerHTML = emptyState('leaf', 'Niets in deze categorie',
      'Voeg groenten toe bij Beheer, of kies een andere categorie.');
    return;
  }

  grid.innerHTML = list.map(p => `
    <button class="tile" data-id="${esc(p.id)}">
      <div class="tile-photo">${photoMarkup(p)}</div>
      <div class="tile-body">
        <span class="tile-nl">${esc(p.nl)}</span>
        <span class="tile-en">${esc(p.en)}</span>
        <span class="tile-price">&euro;&nbsp;${formatEuro(p.price)}
          <span class="tile-unit">/ ${esc(UNIT_LABEL[p.unit] || p.unit)}</span></span>
      </div>
    </button>`).join('');
}

// --- weigh panel ----------------------------------------------------------

function openWeigh(id) {
  current = store.byId(id);
  if (!current) return;
  typed = '';

  $('#weigh-photo').innerHTML = photoMarkup(current);
  $('#weigh-nl').textContent = current.nl;
  $('#weigh-en').textContent = current.en || '';
  $('#weigh-rate').innerHTML =
    `&euro;&nbsp;${formatEuro(current.price)} <span class="tile-unit">per ${esc(UNIT_LABEL[current.unit] || current.unit)}</span>`;
  $('#qty-unit').textContent = isWeighed(current) ? 'kg' : (UNIT_LABEL[current.unit] || current.unit);
  // Whole pieces only - a decimal point there is just a way to make a mistake.
  $('#key-dot').disabled = !isWeighed(current);

  $('#pane-grid').hidden = true;
  $('#pane-weigh').hidden = false;
  drawQty();
  $('#btn-add').focus();
}

function closeWeigh() {
  current = null;
  typed = '';
  $('#pane-weigh').hidden = true;
  $('#pane-grid').hidden = false;
}

function press(k) {
  if (!current) return;
  if (k === 'del') {
    typed = typed.slice(0, -1);
  } else if (k === '.') {
    if (isWeighed(current) && !typed.includes('.')) typed = (typed || '0') + '.';
  } else {
    if (typed.replace('.', '').length >= 6) return;           // 15.000 is the ceiling anyway
    const dec = typed.split('.')[1];
    if (dec && dec.length >= 3) return;                       // the DIGI shows three decimals
    typed += k;
  }
  drawQty();
}

function qtyNumber() {
  return typed === '' || typed === '.' ? NaN : parseNumber(typed);
}

function drawQty() {
  const el = $('#qty-value');
  const show = typed === '' ? '0' : typed.replace('.', ',');
  el.innerHTML = `${esc(show)}<span class="qty-caret"></span>`;
  el.classList.toggle('is-placeholder', typed === '');

  const qty = qtyNumber();
  const note = $('#weigh-note');
  const add = $('#btn-add');

  if (Number.isNaN(qty)) {
    note.className = 'weigh-note';
    note.innerHTML = '';
    $('#weigh-total').innerHTML = '&euro; 0,00';
    add.disabled = true;
    return;
  }

  const check = isWeighed(current)
    ? checkWeight(qty)
    : (qty >= 1 ? { ok: true, level: 'ok', message: '' }
                : { ok: false, level: 'error', message: 'Vul een aantal in.' });

  note.className = `weigh-note is-${check.level}`;
  note.innerHTML = check.message
    ? icon(check.level === 'error' ? 'alert' : 'warn') + `<span>${esc(check.message)}</span>`
    : '';

  const cents = check.ok ? lineTotal(current, qty) : 0;
  $('#weigh-total').innerHTML = `&euro; ${formatEuro(cents)}`;
  add.disabled = !check.ok;
}

function addLine() {
  const qty = qtyNumber();
  if (!current || Number.isNaN(qty)) return;
  const check = isWeighed(current) ? checkWeight(qty) : { ok: qty >= 1 };
  if (!check.ok) return;

  basket.push({ product: current, qty, cents: lineTotal(current, qty) });
  closeWeigh();
  renderBasket();
}

// --- basket ---------------------------------------------------------------

function renderBasket() {
  const box = $('#basket-lines');

  if (!basket.length) {
    box.innerHTML = `<div class="basket-empty">Kies een groente.<br>Weeg op de DIGI,
      typ het gewicht, en het bedrag verschijnt hier.</div>`;
  } else {
    box.innerHTML = basket.map((l, i) => `
      <div class="line">
        <div>
          <div class="line-name">${esc(l.product.nl)}</div>
          <div class="line-qty">${esc(formatQty(l.product, l.qty))}
            ${esc(UNIT_LABEL[l.product.unit] || l.product.unit)}
            &times; &euro;&nbsp;${formatEuro(l.product.price)}</div>
        </div>
        <span class="line-amount">${formatEuro(l.cents)}</span>
        <button class="line-remove line-print" data-i="${i}"
          title="Sticker printen" aria-label="Sticker printen voor ${esc(l.product.nl)}">${icon('printer')}</button>
        <button class="line-remove" data-i="${i}"
          aria-label="${esc(l.product.nl)} verwijderen">${icon('x')}</button>
      </div>`).join('');
  }

  const total = basketTotal(basket);
  const ro = $('#readout');
  $('#readout-value').textContent = formatEuro(total);
  ro.classList.toggle('is-zero', total === 0);
  $('#btn-done').disabled = !basket.length;
  $('#btn-clear').disabled = !basket.length;
}

function removeLine(i) {
  const [gone] = basket.splice(i, 1);
  renderBasket();
  toast(`${gone.product.nl} verwijderd`, 'info', 'Ongedaan maken', () => {
    basket.splice(i, 0, gone);
    renderBasket();
  });
}

function clearBasket() {
  const snapshot = basket;
  basket = [];
  renderBasket();
  toast('Mandje gewist', 'info', 'Ongedaan maken', () => {
    basket = snapshot;
    renderBasket();
  });
}

function finish() {
  const total = basketTotal(basket);
  store.logSale(basket, total);
  toast(`Typ ${formatEuro(total)} in Hanka op de toets groenten`, 'ok');
  basket = [];
  renderBasket();
}

// --- sticker --------------------------------------------------------------

function printSticker(line) {
  const p = line.product;
  $('#sticker').innerHTML = `
    <div class="st-name">${esc(p.nl)}</div>
    <div class="st-en">${esc(p.en || '')}</div>
    <div class="st-row"><span>${esc(formatQty(p, line.qty))} ${esc(UNIT_LABEL[p.unit] || p.unit)}</span>
      <span>&euro; ${formatEuro(p.price)} / ${esc(UNIT_LABEL[p.unit] || p.unit)}</span></div>
    <div class="st-total"><span>Totaal</span><b>&euro; ${formatEuro(line.cents)}</b></div>
    <div class="st-date">${new Date().toLocaleDateString('nl-NL')} &middot; Wereld Supermarkt</div>`;

  document.body.classList.add('printing-sticker');
  window.print();
  document.body.classList.remove('printing-sticker');
}

// --- keyboard -------------------------------------------------------------

function onKey(e) {
  if ($('#view-sell').classList.contains('is-active') === false) return;
  if (e.target.matches('input, textarea')) return;

  if (current) {
    if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); }
    else if (e.key === ',' || e.key === '.') { press('.'); e.preventDefault(); }
    else if (e.key === 'Backspace') { press('del'); e.preventDefault(); }
    else if (e.key === 'Enter') { addLine(); e.preventDefault(); }
    else if (e.key === 'Escape') { closeWeigh(); e.preventDefault(); }
  } else if (e.key === 'Enter' && basket.length) {
    finish();
    e.preventDefault();
  }
}
