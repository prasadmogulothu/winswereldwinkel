// Entry point: load the price list, wire the tabs and the language toggle,
// hand off to the views.

import * as store from './store.js';
import * as sell from './ui-sell.js';
import * as admin from './ui-admin.js';
import * as pricelist from './ui-pricelist.js';
import { t, getLang, setLang, applyStatic } from './i18n.js';
import { $, $$, toast } from './ui.js';

const TABS = [
  { tab: 'tab-sell', view: 'view-sell' },
  { tab: 'tab-admin', view: 'view-admin' },
  { tab: 'tab-list', view: 'view-list' }
];

function show(viewId) {
  TABS.forEach(x => {
    const on = x.view === viewId;
    $('#' + x.tab).setAttribute('aria-selected', String(on));
    $('#' + x.view).classList.toggle('is-active', on);
  });
  if (viewId === 'view-list') pricelist.render();
}

/** Redraw everything in the new language. No reload: it would drop the basket. */
function applyLanguage() {
  applyStatic();
  $$('.lang-btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  sell.refresh();
  admin.render();
  pricelist.render();
}

async function main() {
  try {
    await store.loadSession();
    await store.load();
  } catch (err) {
    applyStatic();
    document.body.innerHTML = `
      <div style="padding:48px;max-width:560px;margin:0 auto;font-family:system-ui;color:#F2F4F0">
        <h1 style="font-size:22px;margin:0 0 12px">${t('err.loadTitle')}</h1>
        <p style="color:#99A1A9;line-height:1.6">${err.message}</p>
        <p style="color:#99A1A9;line-height:1.6">${t('err.loadHint')}</p>
      </div>`;
    return;
  }

  applyStatic();

  sell.init();
  // The admin changes prices and products; the sell grid and the price list
  // both have to follow, so they get told rather than polling.
  admin.init(() => { sell.refresh(); pricelist.render(); });
  pricelist.init();

  TABS.forEach(x => { $('#' + x.tab).onclick = () => show(x.view); });
  $$('.lang-btn').forEach(b => {
    b.onclick = () => { setLang(b.dataset.lang); applyLanguage(); };
  });

  applyLanguage();
  show('view-sell');
}

window.addEventListener('error', e => toast(t('err.generic', { msg: e.message }), 'err'));
window.addEventListener('unhandledrejection', e =>
  toast(t('err.generic', { msg: e.reason?.message || e.reason }), 'err'));

main();
