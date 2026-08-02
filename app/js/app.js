// Entry point: load the price list, wire the three tabs, hand off to the views.

import * as store from './store.js';
import * as sell from './ui-sell.js';
import * as admin from './ui-admin.js';
import * as pricelist from './ui-pricelist.js';
import { $, $$, toast } from './ui.js';

const TABS = [
  { tab: 'tab-sell', view: 'view-sell' },
  { tab: 'tab-admin', view: 'view-admin' },
  { tab: 'tab-list', view: 'view-list' }
];

function show(viewId) {
  TABS.forEach(t => {
    const on = t.view === viewId;
    $('#' + t.tab).setAttribute('aria-selected', String(on));
    $('#' + t.view).classList.toggle('is-active', on);
  });
  if (viewId === 'view-list') pricelist.render();
}

async function main() {
  try {
    await store.loadSession();
    await store.load();
  } catch (err) {
    document.body.innerHTML = `
      <div style="padding:48px;max-width:560px;margin:0 auto;font-family:system-ui;color:#F2F4F0">
        <h1 style="font-size:22px;margin:0 0 12px">De prijslijst kon niet geladen worden</h1>
        <p style="color:#99A1A9;line-height:1.6">${err.message}</p>
        <p style="color:#99A1A9;line-height:1.6">
          Draai je dit op de kassa-pc? Dan draait de server niet: sluit dit venster
          en start <b>start.bat</b> opnieuw.</p>
      </div>`;
    return;
  }

  sell.init();
  // The admin changes prices and products; the sell grid and the price list
  // both have to follow, so they get told rather than polling.
  admin.init(() => { sell.refresh(); pricelist.render(); });
  pricelist.init();

  TABS.forEach(t => { $('#' + t.tab).onclick = () => show(t.view); });
  show('view-sell');
}

window.addEventListener('error', e => toast(`Fout: ${e.message}`, 'err'));
window.addEventListener('unhandledrejection', e => toast(`Fout: ${e.reason?.message || e.reason}`, 'err'));

main();
