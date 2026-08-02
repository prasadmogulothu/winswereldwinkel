// Login gate for Beheer on the hosted version.
//
// This screen only decides what to draw. The gate that actually protects the
// prices is server-side on PUT /api/products - anyone can edit this file in
// devtools, nobody can forge the session cookie.

import * as store from './store.js';
import { t } from './i18n.js';
import { $, esc, icon, toast } from './ui.js';

/** Draws the login form into the Beheer panel. Calls back once logged in. */
export function renderLogin(onSuccess) {
  $('#admin-head').innerHTML = `
    <div>
      <div class="panel-title">${esc(t('tab.admin'))}</div>
      <div class="panel-sub">${esc(t('login.sub'))}</div>
    </div>`;

  $('#admin-body').innerHTML = `
    <form class="login" id="login-form" autocomplete="on">
      <div class="login-icon">${icon('sliders', 'icon')}</div>
      <h2 class="login-title">${esc(t('login.title'))}</h2>
      <p class="login-text">${esc(t('login.text'))}</p>

      <div class="field">
        <label for="f-user">${esc(t('login.user'))}</label>
        <input class="input" id="f-user" name="username" autocomplete="username" value="admin">
      </div>
      <div class="field">
        <label for="f-pass">${esc(t('login.pass'))}</label>
        <input class="input" id="f-pass" name="password" type="password"
               autocomplete="current-password" placeholder="${esc(t('login.pass'))}">
        <div class="err" id="login-err"></div>
      </div>

      <button class="btn btn-primary" id="login-go" type="submit">
        ${icon('check')} ${esc(t('login.go'))}
      </button>
    </form>`;

  $('#admin-foot').innerHTML = '';

  const err = $('#login-err');
  const go = $('#login-go');

  $('#login-form').onsubmit = async e => {
    e.preventDefault();
    err.textContent = '';
    go.disabled = true;
    try {
      await store.login($('#f-user').value.trim(), $('#f-pass').value);
      toast(t('login.ok'), 'ok');
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
    <div><b>${esc(t('login.readOnlyTitle'))}</b> ${esc(t('login.readOnlyText'))}</div>
  </div>`;
}
