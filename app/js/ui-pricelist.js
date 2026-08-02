// Prijslijst - the A4 sheet for the vegetable aisle, plus a full-screen view
// for the spare tablet.
//
// This replaces the customer-facing display: Hanka already owns the till's
// second screen, and taking it over would break his customer display.

import * as store from './store.js';
import { formatEuro, UNIT_LABEL } from './money.js';
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
    $('#list-body').innerHTML = emptyState('leaf', 'Nog geen prijslijst',
      'Voeg groenten toe bij Beheer, dan verschijnt de lijst hier.');
    return;
  }

  $('#list-body').innerHTML = kiosk ? kioskHtml(list) : sheetHtml(list);
}

function sheetHtml(list) {
  const today = new Date().toLocaleDateString('nl-NL',
    { day: 'numeric', month: 'long', year: 'numeric' });

  const groups = store.categories()
    .map(c => ({ cat: c, items: list.filter(p => p.category === c.id) }))
    .filter(g => g.items.length);

  return `
    <div class="sheet">
      <div class="sheet-head">
        <div class="sheet-title">Groenten &amp; kruiden</div>
        <div class="sheet-date">Prijzen geldig vanaf ${esc(today)}</div>
      </div>

      <div class="sheet-cats">
        ${groups.map(g => `
          <section class="sheet-cat">
            <h3>${esc(g.cat.nl)} &middot; ${esc(g.cat.en)}</h3>
            ${g.items.map(p => `
              <div class="sheet-row">
                <span class="sheet-name">${esc(p.nl)}</span>
                <span class="sheet-en">${esc(p.en || '')}</span>
                <span class="sheet-dots"></span>
                <span class="sheet-price">&euro; ${formatEuro(p.price)}
                  <span class="sheet-unit">/ ${esc(UNIT_LABEL[p.unit] || p.unit)}</span></span>
              </div>`).join('')}
          </section>`).join('')}
      </div>

      <div class="sheet-foot">
        Wereld Supermarkt &middot; prijzen inclusief btw &middot; wijzigingen voorbehouden
      </div>
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
              <div class="kiosk-name">${esc(p.nl)}</div>
              <div class="kiosk-en">${esc(p.en || '')}</div>
            </div>
            <div class="kiosk-price">&euro; ${formatEuro(p.price)}
              <span class="kiosk-unit">per ${esc(UNIT_LABEL[p.unit] || p.unit)}</span></div>
          </div>`).join('')}
      </div>
    </div>`;
}

