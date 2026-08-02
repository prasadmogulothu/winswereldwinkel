// Login gate for Beheer on the hosted version.
//
// This screen only decides what to draw. The gate that actually protects the
// prices is server-side on PUT /api/products - anyone can edit this file in
// devtools, nobody can forge the session cookie.

import * as store from './store.js';
import { $, esc, icon, toast } from './ui.js';

/** Draws the login form into the Beheer panel. Resolves once logged in. */
export function renderLogin(onSuccess) {
  $('#admin-head').innerHTML = `
    <div>
      <div class="panel-title">Beheer</div>
      <div class="panel-sub">Log in om prijzen te wijzigen.</div>
    </div>`;

  $('#admin-body').innerHTML = `
    <form class="login" id="login-form" autocomplete="on">
      <div class="login-icon">${icon('sliders', 'icon')}</div>
      <h2 class="login-title">Inloggen</h2>
      <p class="login-text">Alleen voor de winkeleigenaar. Het verkoopscherm en de
        prijslijst blijven gewoon zonder inloggen werken.</p>

      <div class="field">
        <label for="f-user">Gebruikersnaam</label>
        <input class="input" id="f-user" name="username" autocomplete="username" value="admin">
      </div>
      <div class="field">
        <label for="f-pass">Wachtwoord</label>
        <input class="input" id="f-pass" name="password" type="password"
               autocomplete="current-password" placeholder="Wachtwoord">
        <div class="err" id="login-err"></div>
      </div>

      <button class="btn btn-primary" id="login-go" type="submit">
        ${icon('check')} Inloggen
      </button>
    </form>`;

  $('#admin-foot').innerHTML = '';

  const form = $('#login-form');
  const err = $('#login-err');
  const go = $('#login-go');

  form.onsubmit = async e => {
    e.preventDefault();
    err.textContent = '';
    go.disabled = true;
    try {
      await store.login($('#f-user').value.trim(), $('#f-pass').value);
      toast('Ingelogd', 'ok');
      onSuccess();
    } catch (ex) {
      err.textContent = ex.message;
      $('#f-pass').select();
    } finally {
      go.disabled = false;
    }
  };

  $('#f-pass').focus();
}

/** Warning strip for when the host has no storage wired up yet. */
export function readOnlyNotice() {
  return `<div class="notice">
    ${icon('warn')}
    <div><b>Opslaan staat uit.</b> Deze omgeving heeft geen opslag gekoppeld,
    dus wijzigingen worden niet bewaard. Koppel in Vercel een Blob store
    (<code>BLOB_READ_WRITE_TOKEN</code>) en deploy opnieuw.</div>
  </div>`;
}
