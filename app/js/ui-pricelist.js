// Prijslijst - the A4 sheet for the vegetable aisle, plus a full-screen view
// for the spare tablet.
//
// This replaces the customer-facing display: Hanka already owns the till's
// second screen, and taking it over would break his customer display.

import * as store from './store.js';
import { formatEuro } from './money.js';
import { t, unit, pName, pSub, cName, cSub, today } from './i18n.js';
import { $, esc, photoMarkup, emptyState } from './ui.js';

let kiosk = false;

export function init() {
  $('#btn-print-sheet').onclick = () => window.print();
  $('#btn-kiosk').onclick = () => { kiosk = !kiosk; render(); };
  render();
}

export function render() {
  const list = store.products().filter(p => p.active !== false);

  if (!list.length) {
    $('#list-body').innerHTML = emptyState('leaf', t('list.emptyTitle'), t('list.emptyHint'));
    return;
  }

  $('#list-body').innerHTML = kiosk ? kioskHtml(list) : sheetHtml(list);
}

function sheetHtml(list) {
  const groups = store.categories()
    .map(c => ({ cat: c, items: list.filter(p => p.category === c.id) }))
    .filter(g => g.items.length);

  return `
    <div class="sheet">
      <div class="sheet-head">
        <div class="sheet-title">${esc(t('list.sheetTitle'))}</div>
        <div class="sheet-date">${esc(t('list.validFrom', { date: today() }))}</div>
      </div>

      <div class="sheet-cats">
        ${groups.map(g => `
          <section class="sheet-cat">
            <h3>${esc(cName(g.cat))} &middot; ${esc(cSub(g.cat))}</h3>
            ${g.items.map(p => `
              <div class="sheet-row">
                <span class="sheet-name">${esc(pName(p))}</span>
                <span class="sheet-en">${esc(pSub(p))}</span>
                <span class="sheet-dots"></span>
                <span class="sheet-price">&euro; ${formatEuro(p.price)}
                  <span class="sheet-unit">/ ${esc(unit(p.unit))}</span></span>
              </div>`).join('')}
          </section>`).join('')}
      </div>

      <div class="sheet-foot">${esc(t('list.footer'))}</div>
    </div>`;
}

function kioskHtml(list) {
  return `
    <div class="kiosk">
      <div class="kiosk-grid">
        ${list.map(p => `
          <div class="kiosk-card">
            <span class="thumb">${photoMarkup(p)}</span>
            <div>
              <div class="kiosk-name">${esc(pName(p))}</div>
              <div class="kiosk-en">${esc(pSub(p))}</div>
            </div>
            <div class="kiosk-price">&euro; ${formatEuro(p.price)}
              <span class="kiosk-unit">${esc(t('sell.perUnit', { unit: unit(p.unit) }))}</span></div>
          </div>`).join('')}
      </div>
    </div>`;
}
