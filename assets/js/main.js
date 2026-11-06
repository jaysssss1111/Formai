/* formai — site logic (vanilla JavaScript, no build step).
 * Ported from the original component in brand/Main.dc.html.
 * Handles: loader, theme, language, animation pause, mobile menu,
 * cookie consent, policy dialogs, contact form and booking calendar.
 */
(function () {
  'use strict';

  var root = document.getElementById('top');
  // .../assets/ — works from / and /fi/ alike.
  var ASSETS = ((document.currentScript && document.currentScript.src) || '').replace(/js\/main\.js.*$/, '');
  var I18N = window.FM_I18N;

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var SS = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ICON_ARROW = '<svg class="fm-arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7 H12 M8 3 L12 7 L8 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>';
  var ICON_BACK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M13 7 H2 M6 3 L2 7 L6 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>';
  var ICON_CLOSE = '<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4 L16 16 M16 4 L4 16" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>';
  var ICON_ALERT = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style="flex: none;"><path d="M5 0 L10 5 L5 10 L0 5 Z" style="fill: var(--accent);"></path></svg>';
  var EYE_DRAW = '<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" style="display: block;"><path class="fm-ld-lid" d="M4 32 Q32 8 60 32 Q32 56 4 32 Z" pathLength="1" style="fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: miter; stroke-miterlimit: 10;"></path><path d="M32 23 L41 32 L32 41 L23 32 Z" style="fill: var(--brand);"></path></svg>';
  var MONO = "font-family: 'DM Mono', ui-monospace, monospace;";
  var LABEL = MONO + ' font-size: 12px; font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase;';
  var BTN_SQ = 'display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex: none; padding: 0; border: 1px solid var(--strong); border-radius: 0; background: transparent; color: var(--ink); cursor: pointer;';
  var DLG = 'width: 100%; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box; background: var(--surface); border: 1px solid var(--strong); border-top: 2px solid var(--brand); color: var(--ink); padding: 40px; display: flex; flex-direction: column; gap: 24px;';
  var OVERLAY = 'position: fixed; inset: 0; background: rgba(20, 18, 16, 0.72); display: flex; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box;';

  /* ---------- stored preferences ---------- */
  function readConsent() {
    try {
      var rec = JSON.parse(LS.get('fm-consent') || 'null');
      var fresh = rec && rec.v === 1 && rec.at && (Date.now() - Date.parse(rec.at)) < 365 * 24 * 3600 * 1000;
      return fresh ? rec : null;
    } catch (e) { return null; }
  }
  var consent = readConsent();
  var allowPrefs = !!(consent && consent.prefs);
  function save(k, v) { if (allowPrefs) LS.set(k, v); }

  var sysMode = 'light';   // first visit: the light theme, whatever the device setting
  var navLang = String(navigator.language || '').toLowerCase().indexOf('fi') === 0 ? 'fi' : '';

  // The language switch hands the theme and the pause setting to the other
  // language's page (once, through this tab's session), so they stay as they
  // were even without preference storage.
  var carried = (function () { try { var c = JSON.parse(SS.get('fm-lang-pos') || 'null'); return c && Date.now() - c.t < 15000 ? c : null; } catch (e) { return null; } })();
  var state = {
    mode: (carried && carried.mode) || (allowPrefs && LS.get('fm-mode')) || sysMode || 'dark',
    // Prerendered pages (/ and /fi/) carry their language; the template falls back to prefs.
    lang: document.documentElement.getAttribute('data-page-lang') || (allowPrefs && LS.get('fm-lang')) || navLang || 'en',
    paused: carried && typeof carried.paused === 'boolean' ? carried.paused : allowPrefs && LS.get('fm-paused') === '1',
    menuOpen: false,
    bannerOpen: !consent,
    draft: { prefs: !!(consent && consent.prefs), analytics: !!(consent && consent.analytics), marketing: !!(consent && consent.marketing) },
    dialog: '',
    contactOpen: false,
    au: { open: false, sent: false, tried: false, sending: false, sendError: false, kind: -1, more: false, data: { url: '', email: '', name: '', company: '', note: '' } },
    cf: { sent: false, tried: false, sending: false, sendError: false, data: { name: '', email: '', company: '', message: '' }, interests: [] },
    ci: { sent: false, tried: false, sending: false, sendError: false, more: false, recap: '', data: { name: '', email: '', message: '', link: '' } },
    bk: { calOff: 0, date: '', slot: '', step: '', tried: false, data: { name: '', email: '', company: '', topic: '' }, interests: [], doneSummary: '', sending: false, sendError: false },
    ready: false
  };
  var opener = null;

  function t() {
    var L = state.lang === 'fi' ? 'fi' : 'en';
    return Object.assign({}, I18N.T[L], I18N.LEGAL[L]);
  }

  /* ---------- static text ---------- */
  function applyText() {
    var tr = t();
    document.documentElement.lang = state.lang;
    root.setAttribute('lang', state.lang);
    $$('[data-i18n]').forEach(function (el) {
      var v = get(tr, el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.textContent = v;
    });
    $$('[data-i18n-aria-label]').forEach(function (el) {
      var v = get(tr, el.getAttribute('data-i18n-aria-label'));
      if (typeof v === 'string') el.setAttribute('aria-label', v);
    });
    $$('[data-i18n-placeholder]').forEach(function (el) {
      var v = get(tr, el.getAttribute('data-i18n-placeholder'));
      if (typeof v === 'string') el.setAttribute('placeholder', v);
    });
    $$('[data-list]').forEach(function (el) {
      var list = get(tr, el.getAttribute('data-list')) || [];
      el.innerHTML = list.map(function (tag) {
        return '<span style="' + LABEL + ' line-height: 1; padding: 8px 12px; border: 1px solid var(--strong); color: var(--muted);">' + esc(tag) + '</span>';
      }).join('');
    });
    $$('.fm-lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('lang') === state.lang));
    });
    if (tr.meta && tr.meta.title) document.title = tr.meta.title;
    document.dispatchEvent(new CustomEvent('fm:lang', { detail: { lang: state.lang } }));
  }

  /* ---------- theme, motion, menu ---------- */
  function applyChrome() {
    var dark = state.mode !== 'light';
    var en = state.lang !== 'fi';
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var tc = $('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', dark ? '#141210' : '#EDE6D8');
    var fav = $('link[rel="icon"]'); if (fav) fav.setAttribute('href', 'assets/logos/formai-eye-mark-' + (dark ? 'cream' : 'charcoal') + '.svg');
    var label = dark ? (en ? 'Switch to light mode' : 'Vaihda vaaleaan tilaan') : (en ? 'Switch to dark mode' : 'Vaihda tummaan tilaan');
    var mb = $('#fm-mode-btn'); mb.setAttribute('aria-label', label); mb.setAttribute('title', label);
    root.classList.toggle('fm-motion', !state.paused);
    root.classList.toggle('fm-ready', state.ready);
    var pb = $('.fm-pause'); pb.setAttribute('aria-pressed', String(state.paused));
    $('#fm-pause-label').textContent = state.paused ? t().play : t().pause;
    $('#fm-nav').classList.toggle('is-open', state.menuOpen);
    $('.fm-menu-btn').setAttribute('aria-expanded', String(state.menuOpen));
    document.dispatchEvent(new CustomEvent('fm:motion', { detail: { paused: state.paused } }));
  }

  /* ---------- cookie banner ---------- */
  function commitConsent(prefs, an, mk) {
    var rec = { v: 1, at: new Date().toISOString(), prefs: prefs, analytics: an, marketing: mk };
    LS.set('fm-consent', JSON.stringify(rec));
    consent = rec;
    allowPrefs = prefs;
    if (prefs) {
      save('fm-mode', state.mode); save('fm-lang', state.lang); save('fm-paused', state.paused ? '1' : '0');
      if (typeof saveLikes === 'function') saveLikes();
    } else {
      ['fm-mode', 'fm-lang', 'fm-paused', 'fm-ci-draft', 'fm-news-likes'].forEach(LS.del);
    }
    state.bannerOpen = false;
    state.draft = { prefs: prefs, analytics: an, marketing: mk };
    renderBanner();
  }

  function renderBanner() {
    var host = $('#fm-banner-root');
    if (!(state.ready && state.bannerOpen)) { host.innerHTML = ''; return; }
    var ck = t().ck;
    var d = state.draft;
    var cats = [
      { id: 'nec', name: ck.nec, desc: ck.necD, on: true, locked: true, text: ck.always },
      { id: 'prefs', name: ck.pref, desc: ck.prefD, on: d.prefs },
      { id: 'analytics', name: ck.an, desc: ck.anD, on: d.analytics },
      { id: 'marketing', name: ck.mk, desc: ck.mkD, on: d.marketing }
    ];
    if (!state.ckMore) {
      host.innerHTML = '<section class="fm-cookie fm-cookie-bar" role="region" aria-labelledby="fm-ck-title">' +
        '<div class="fm-ckb-text"><span id="fm-ck-title" class="fm-ckb-label">' + esc(ck.label) + '</span>' +
        '<p>' + esc(ck.short) + ' <button type="button" class="fm-inline-link" data-action="openCookies">' + esc(ck.cookiePolicy) + '</button></p></div>' +
        '<div class="fm-ckb-actions">' +
        '<button type="button" class="fm-btn fm-ck-btn" data-action="rejectAll">' + esc(ck.reject) + '</button>' +
        '<button type="button" class="fm-btn fm-ck-btn" data-action="acceptAll">' + esc(ck.accept) + '</button>' +
        '<button type="button" class="fm-btn fm-ck-btn fm-ckb-more" data-action="ckMore">' + esc(ck.settingsBtn) + '</button></div>' +
        '</section>';
      return;
    }
    var html = '<section class="fm-cookie" role="region" aria-labelledby="fm-ck-title" style="position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 90; width: auto; max-width: 600px; max-height: calc(100vh - 32px); overflow-y: auto; box-sizing: border-box; background: var(--raised); border: 1px solid var(--strong); border-top: 2px solid var(--brand); color: var(--ink); padding: 28px; display: flex; flex-direction: column; gap: 20px;">' +
      '<span style="' + LABEL + ' color: var(--accent);">' + esc(ck.label) + '</span>' +
      '<h2 id="fm-ck-title" style="margin: -8px 0 0; font-size: 28px; line-height: 1.15; font-weight: 300; letter-spacing: -0.02em;">' + esc(ck.title) + '</h2>' +
      '<p style="margin: 0; font-size: 15px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(ck.intro) + '</p>' +
      '<div style="display: flex; flex-direction: column; gap: 8px;"><span style="font-size: 15px; font-weight: 400;">' + esc(ck.howTitle) + '</span>' +
      '<ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px;">' +
      ck.how.map(function (x, i) {
        return '<li style="display: flex; gap: 12px; font-size: 14px; line-height: 1.5; color: var(--muted);"><span style="' + MONO + ' font-size: 12px; color: var(--accent); flex: none; padding-top: 2px;">0' + (i + 1) + '</span><span>' + esc(x) + '</span></li>';
      }).join('') + '</ol></div>' +
      '<div style="display: flex; flex-direction: column; border-top: 1px solid var(--line);">' +
      cats.map(function (c) {
        var txt = c.text || (c.on ? ck.on : ck.off);
        return '<div style="display: flex; gap: 16px; align-items: flex-start; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--line);">' +
          '<div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;"><span id="fm-ck-' + c.id + '" style="font-size: 16px; font-weight: 400;">' + esc(c.name) + '</span>' +
          '<span style="font-size: 14px; line-height: 1.5; font-weight: 300; color: var(--muted);">' + esc(c.desc) + '</span></div>' +
          '<div style="display: flex; align-items: center; gap: 10px; flex: none;"><span aria-hidden="true" style="' + MONO + ' font-size: 11px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); text-align: right;">' + esc(txt) + '</span>' +
          '<button type="button" role="switch" class="fm-switch' + (c.on ? ' is-on' : '') + '" aria-checked="' + c.on + '" aria-labelledby="fm-ck-' + c.id + '"' + (c.locked ? ' disabled' : ' data-action="toggleCat" data-cat="' + c.id + '"') + '><span class="fm-knob"></span></button></div></div>';
      }).join('') + '</div>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 12px;">' +
      '<button type="button" class="fm-btn fm-ck-btn" data-action="rejectAll">' + esc(ck.reject) + '</button>' +
      '<button type="button" class="fm-btn fm-ck-btn" data-action="acceptAll">' + esc(ck.accept) + '</button>' +
      '<button type="button" class="fm-btn fm-ck-btn fm-ck-primary" data-action="confirmChoices">' + esc(ck.confirm) + '</button></div>' +
      '<p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(ck.more) + ' <button type="button" class="fm-inline-link" data-action="openCookies">' + esc(ck.cookiePolicy) + '</button>, <button type="button" class="fm-inline-link" data-action="openPrivacy">' + esc(ck.privacy) + '</button></p>' +
      '</section>';
    var focusCat = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-cat');
    host.innerHTML = html;
    if (focusCat) { var b = host.querySelector('[data-cat="' + focusCat + '"]'); if (b) b.focus(); }
  }

  /* ---------- policy dialog ---------- */
  function docSections(list) {
    return (list || []).map(function (s) {
      return '<div style="display: flex; flex-direction: column; gap: 10px;"><h3 style="margin: 0; font-size: 20px; line-height: 1.3; font-weight: 400;">' + esc(s.h) + '</h3>' +
        s.ps.map(function (p) { return '<p style="margin: 0; font-size: 15px; line-height: 1.65; font-weight: 300; color: var(--muted);">' + esc(p) + '</p>'; }).join('') + '</div>';
    }).join('');
  }
  function renderDoc() {
    var host = $('#fm-doc-root');
    if (!state.dialog) { host.innerHTML = ''; return; }
    var tr = t();
    var doc = state.dialog === 'privacy' ? tr.privacyDoc : tr.cookieDoc;
    var rows = doc.rows ? '<div style="display: flex; flex-direction: column; border-top: 1px solid var(--line);">' + doc.rows.map(function (r) {
      return '<div style="display: flex; flex-direction: column; gap: 6px; padding: 14px 0; border-bottom: 1px solid var(--line);">' +
        '<span style="' + MONO + ' font-size: 13px; font-weight: 400; color: var(--ink);">' + esc(r.name) + '</span>' +
        '<span style="font-size: 14px; line-height: 1.5; font-weight: 300; color: var(--muted);">' + esc(tr.rowLabels.purpose) + ': ' + esc(r.purpose) + '</span>' +
        '<span style="font-size: 14px; line-height: 1.5; font-weight: 300; color: var(--muted);">' + esc(tr.rowLabels.type) + ': ' + esc(r.type) + ' · ' + esc(tr.rowLabels.duration) + ': ' + esc(r.duration) + ' · ' + esc(tr.rowLabels.category) + ': ' + esc(r.category) + '</span></div>';
    }).join('') + '</div>' : '';
    host.innerHTML = '<div data-overlay="doc" style="' + OVERLAY + ' z-index: 150;">' +
      '<div class="fm-dlg" role="dialog" aria-modal="true" aria-labelledby="fm-dlg-title" tabindex="-1" style="' + DLG + ' max-width: 760px;">' +
      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"><span style="' + LABEL + ' color: var(--muted);">' + esc(doc.updated) + '</span>' +
      '<button type="button" class="fm-mode" data-action="closeDoc" aria-label="' + esc(tr.ck.close) + '" style="' + BTN_SQ + '">' + ICON_CLOSE + '</button></div>' +
      '<h2 id="fm-dlg-title" style="margin: 0; font-size: clamp(32px, 5vw, 48px); line-height: 1; font-weight: 200; letter-spacing: -0.03em;">' + esc(doc.title) + '</h2>' +
      docSections(doc.a) + rows + docSections(doc.b) + '</div></div>';
  }
  function openDoc(kind) {
    opener = document.activeElement;
    state.dialog = kind;
    renderDoc();
    var d = $('#fm-doc-root .fm-dlg'); if (d) d.focus();
  }
  function closeDoc() {
    state.dialog = '';
    renderDoc();
    restoreFocus();
  }
  function restoreFocus() {
    var o = opener; opener = null;
    setTimeout(function () { try { if (o && o.focus && document.contains(o)) o.focus(); } catch (e) {} }, 0);
  }

  /* ---------- contact dialog ---------- */
  function cfErrors() {
    var tr = t().cf, f = state.cf.data;
    return {
      name: String(f.name).trim() ? '' : tr.errName,
      email: EMAIL_RE.test(String(f.email).trim()) ? '' : tr.errEmail,
      message: String(f.message).trim().length >= 10 ? '' : tr.errMessage
    };
  }
  function field(id, label, opts) {
    var cf = t().cf;
    var req = opts.required ? ' <span aria-hidden="true" style="color: var(--accent);">*</span>' : ' <span style="color: var(--muted); font-weight: 300;">(' + esc(cf.optional) + ')</span>';
    var err = opts.err;
    var describedBy = [opts.hint ? id + '-hint' : '', opts.required ? id + '-err' : ''].filter(Boolean).join(' ');
    var attrs = ' id="' + id + '" class="fm-input" data-field="' + opts.key + '"' + (opts.required ? ' aria-required="true" aria-invalid="' + (err ? 'true' : 'false') + '"' : '') + (describedBy ? ' aria-describedby="' + describedBy + '"' : '');
    var input = opts.textarea
      ? '<textarea' + attrs + ' rows="' + (opts.rows || 5) + '"' + (opts.style ? ' style="' + opts.style + '"' : '') + '>' + esc(opts.value) + '</textarea>'
      : '<input' + attrs + ' type="' + (opts.type || 'text') + '"' + (opts.type === 'email' ? ' inputmode="email"' : '') + (opts.ac ? ' autocomplete="' + opts.ac + '"' : '') + ' value="' + esc(opts.value) + '">';
    return '<div class="fm-field"><label for="' + id + '">' + esc(label) + req + '</label>' +
      (opts.hint ? '<span id="' + id + '-hint" class="fm-hint">' + esc(opts.hint) + '</span>' : '') +
      input + (err ? '<span id="' + id + '-err" class="fm-err">' + esc(err) + '</span>' : '') + '</div>';
  }
  function errorSummary() {
    return '<div role="alert" style="display: flex; align-items: center; gap: 12px; border: 1px solid var(--accent); padding: 12px 16px; font-size: 14px; line-height: 1.5; color: var(--ink);">' + ICON_ALERT + esc(t().cf.errSummary) + '</div>';
  }
  function sendErrorBox() {
    return '<div role="alert" style="display: flex; align-items: center; gap: 12px; border: 1px solid var(--accent); padding: 12px 16px; font-size: 14px; line-height: 1.5; color: var(--ink);">' + ICON_ALERT + esc(t().cf.errSend) + '</div>';
  }
  // Hidden field that people never see; bots that fill it in are ignored.
  var HONEYPOT = '<input type="text" name="_gotcha" class="fm-hp" tabindex="-1" autocomplete="off" aria-hidden="true">';
  function isBot(form) { var h = form && form.querySelector('[name="_gotcha"]'); return !!(h && h.value); }
  var warned = false;
  function postForm(endpoint, data) {
    if (!endpoint) {
      if (!warned) { warned = true; console.warn('formai: form endpoint not set in assets/js/config.js, submission was not sent.'); }
      return Promise.resolve();
    }
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  }
  function submitLabel(text, sending) {
    return sending ? esc(t().cf.sending) : esc(text) + ' ' + ICON_ARROW;
  }
  function privacyLine() {
    var tr = t();
    return '<p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(tr.cf.privacy) + ' <button type="button" class="fm-inline-link" data-action="openPrivacy">' + esc(tr.ck.privacy) + '</button></p>';
  }
  function interestPicker(selected, form) {
    var cf = t().cf;
    return '<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 10px; min-width: 0;"><legend class="fm-legend" style="padding: 0; margin-bottom: 10px;">' + esc(cf.interest) + ' <span style="color: var(--muted); font-weight: 300;">(' + esc(cf.optional) + ')</span></legend>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + cf.interests.map(function (label, i) {
        var on = !!selected[i];
        return '<button type="button" class="fm-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-action="toggleInterest" data-form="' + form + '" data-i="' + i + '">' + esc(label) + '</button>';
      }).join('') + '</div></fieldset>';
  }
  function selectedInterests(selected) {
    return t().cf.interests.filter(function (_, i) { return selected[i]; });
  }
  function renderContact() {
    var host = $('#fm-contact-root');
    if (!state.contactOpen) { host.innerHTML = ''; return; }
    var tr = t(), cf = tr.cf, c = state.cf;
    var body;
    if (c.sent) {
      body = '<div role="status" style="display: flex; flex-direction: column; align-items: flex-start; gap: 20px; padding: 8px 0 4px;">' + EYE_DRAW +
        '<h2 id="fm-cf-title" style="margin: 0; font-size: clamp(32px, 5vw, 48px); line-height: 1; font-weight: 200; letter-spacing: -0.03em;">' + esc(cf.thanksTitle) + '</h2>' +
        '<p style="margin: 0; font-size: 16px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(cf.thanksText) + '</p>' +
        '<button type="button" class="fm-btn fm-ck-btn fm-ck-primary" data-action="closeContact" style="flex: none;">' + esc(cf.done) + '</button></div>';
    } else {
      var e = c.tried ? cfErrors() : { name: '', email: '', message: '' };
      var hasErr = !!(e.name || e.email || e.message);
      body = '<div style="display: flex; flex-direction: column; gap: 12px;"><h2 id="fm-cf-title" style="margin: 0; font-size: clamp(32px, 5vw, 48px); line-height: 1; font-weight: 200; letter-spacing: -0.03em;">' + esc(cf.title) + '</h2>' +
        '<p style="margin: 0; font-size: 15px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(cf.intro) + '</p></div>' +
        (hasErr ? errorSummary() : '') + (c.sendError ? sendErrorBox() : '') +
        '<form id="fm-cf-form" novalidate style="position: relative; display: flex; flex-direction: column; gap: 20px; margin: 0;">' + HONEYPOT +
        field('fm-cf-name', cf.name, { key: 'name', required: true, ac: 'name', value: c.data.name, err: e.name }) +
        field('fm-cf-email', cf.email, { key: 'email', required: true, type: 'email', ac: 'email', value: c.data.email, err: e.email }) +
        field('fm-cf-company', cf.company, { key: 'company', ac: 'organization', value: c.data.company }) +
        interestPicker(c.interests, 'cf') +
        field('fm-cf-message', cf.message, { key: 'message', required: true, textarea: true, hint: cf.messageHint, value: c.data.message, err: e.message }) +
        privacyLine() +
        '<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;"><span style="' + LABEL + ' color: var(--muted);">' + esc(cf.required) + '</span>' +
        '<button type="submit" class="fm-btn fm-ck-btn fm-ck-primary" style="flex: none;"' + (c.sending ? ' disabled aria-busy="true"' : '') + '>' + submitLabel(cf.send, c.sending) + '</button></div></form>';
    }
    host.innerHTML = '<div data-overlay="contact" style="' + OVERLAY + ' z-index: 140;">' +
      '<div class="fm-dlg" role="dialog" aria-modal="true" aria-labelledby="fm-cf-title" tabindex="-1" style="' + DLG + ' max-width: 600px;">' +
      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"><span style="' + LABEL + ' color: var(--accent);">' + esc(cf.label) + '</span>' +
      '<button type="button" class="fm-mode" data-action="closeContact" aria-label="' + esc(tr.ck.close) + '" style="' + BTN_SQ + '">' + ICON_CLOSE + '</button></div>' +
      body + '</div></div>';
  }
  /* ---------- Contact section: the form in the page ----------
     Name, email and message, with message starters that fill the box. Sends
     to the same address as the contact dialog. */
  var CI_DRAFT = 'fm-ci-draft', ciSaveT = 0;
  function ciLoadDraft() {
    if (!allowPrefs) return;
    try {
      var d = JSON.parse(LS.get(CI_DRAFT) || 'null');
      if (d && typeof d === 'object') ['name', 'email', 'message', 'link'].forEach(function (k) { if (typeof d[k] === 'string') state.ci.data[k] = d[k]; });
      if (state.ci.data.link) state.ci.more = true;
    } catch (e) {}
  }
  function ciSaveDraft() {
    clearTimeout(ciSaveT);
    ciSaveT = setTimeout(function () {
      if (!allowPrefs) return;
      var d = state.ci.data, any = ['name', 'email', 'message', 'link'].some(function (k) { return String(d[k] || '').trim(); });
      if (any) LS.set(CI_DRAFT, JSON.stringify(d)); else LS.del(CI_DRAFT);
      var n = $('#fm-ci-saved'); if (n) n.hidden = !any;
    }, 400);
  }
  function ciErrors() {
    var tr = t().cf, f = state.ci.data;
    return {
      name: String(f.name).trim() ? '' : tr.errName,
      email: EMAIL_RE.test(String(f.email).trim()) ? '' : tr.errEmail,
      message: String(f.message).trim().length >= 10 ? '' : tr.errMessage
    };
  }
  var ciDraftLoaded = false;
  function renderInline() {
    if (!ciDraftLoaded) { ciDraftLoaded = true; ciLoadDraft(); }
    var host = $('#fm-ci-root');
    if (!host) return;
    var tr = t(), cf = tr.cf, C = tr.ci, c = state.ci;
    if (c.sent) {
      var AR = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7 H12 M8 3 L12 7 L8 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>';
      host.innerHTML = '<div role="status" class="fm-ci-done" tabindex="-1">' + EYE_DRAW +
        '<h3 style="margin: 0; font-size: clamp(28px, 3.4vw, 40px); line-height: 1.05; font-weight: 200; letter-spacing: -0.03em;">' + esc(cf.thanksTitle) + '</h3>' +
        (c.recap ? '<div class="fm-ci-recap"><span>' + esc(C.youWrote) + '</span><p>' + esc(c.recap) + '</p></div>' : '') +
        '<p class="fm-ci-when"><span class="fm-live-dot' + (liveOn ? ' is-on' : '') + '" aria-hidden="true"></span>' + esc(liveOn ? C.liveOn : C.liveOff) + '</p>' +
        '<div class="fm-ci-wait"><span>' + esc(C.wait) + '</span><div>' +
        '<button type="button" class="fm-ct-altlink" data-action="openAudit"><span>' + esc(C.waitAudit) + '</span> ' + AR + '</button>' +
        '<a class="fm-ct-altlink" href="#book"><span>' + esc(C.waitBook) + '</span> ' + AR + '</a></div></div>' +
        '<button type="button" class="fm-btn fm-ck-btn" data-action="ciAgain" style="flex: none;">' + esc(C.again) + '</button></div>';
      return;
    }
    var e = c.tried ? ciErrors() : { name: '', email: '', message: '' };
    var hasErr = !!(e.name || e.email || e.message);
    var msg = String(c.data.message).trim();
    var PLUS = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6 H11 M6 1 V11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>';
    host.innerHTML =
      '<h3 class="fm-ci-title">' + esc(C.formTitle) + '</h3>' +
      (hasErr ? errorSummary() : '') + (c.sendError ? sendErrorBox() : '') +
      '<form id="fm-ci-form" class="fm-ci-form" novalidate>' + HONEYPOT +
      field('fm-ci-message', cf.message, { key: 'message', required: true, textarea: true, rows: 3, value: c.data.message, err: e.message }) +
      '<div class="fm-ci-starters" role="group" aria-label="' + esc(C.startersLabel) + '"><span>' + esc(C.startersShort) + '</span>' +
      C.starters.map(function (x, k) {
        var on = msg.indexOf(x) !== -1;
        return '<button type="button" class="fm-ci-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-action="ciStarter" data-i="' + k + '" title="' + esc(x) + '">' + esc(C.starterChips[k]) + '</button>';
      }).join('') + '</div>' +
      '<div class="fm-ci-row">' +
      field('fm-ci-name', cf.name, { key: 'name', required: true, ac: 'name', value: c.data.name, err: e.name }) +
      field('fm-ci-email', cf.email, { key: 'email', required: true, type: 'email', ac: 'email', value: c.data.email, err: e.email }) +
      '</div>' +
      (c.more ? field('fm-ci-link', C.link, { key: 'link', type: 'url', ac: 'url', value: c.data.link })
        : '<button type="button" class="fm-ci-more" data-action="ciMore">' + PLUS + esc(C.addLink) + '</button>') +
      '<div class="fm-ci-foot">' + privacyLine() +
      '<button type="submit" class="fm-btn fm-ck-btn fm-ck-primary" style="flex: none;"' + (c.sending ? ' disabled aria-busy="true"' : '') + '>' + submitLabel(cf.send, c.sending) + '</button></div>' +
      '<span class="fm-ci-meta">' + esc(cf.required) +
      '<span class="fm-ci-saved" id="fm-ci-saved"' + (allowPrefs && String(c.data.message || c.data.name || '').trim() ? '' : ' hidden') + '> · ' + esc(C.saved) + '</span></span>' +
      '</form>';
  }
  function submitInline() {
    var c = state.ci, e = ciErrors();
    if (e.name || e.email || e.message) {
      c.tried = true; renderInline();
      var first = $('#fm-ci-root [aria-invalid="true"]'); if (first) first.focus();
      return;
    }
    if (c.sending) return;
    var d = c.data;
    var done = function () {
      var first = String(d.message).trim().split('\n')[0];
      state.ci = { sent: true, tried: false, sending: false, sendError: false, more: false,
        recap: first.length > 120 ? first.slice(0, 117) + '…' : first,
        data: { name: '', email: '', message: '', link: '' } };
      LS.del(CI_DRAFT);
      renderInline();
      var s2 = $('#fm-ci-root .fm-ci-done'); if (s2) s2.focus();
    };
    if (isBot($('#fm-ci-form'))) { done(); return; }
    var payload = {
      _subject: 'formai: message from ' + String(d.name).trim(),
      name: String(d.name).trim(), email: String(d.email).trim(),
      message: String(d.message).trim(),
      link: String(d.link || '').trim(),
      source: 'contact section', language: state.lang
    };
    c.sending = true; c.sendError = false; renderInline();
    postForm((window.FM_CONFIG || {}).contactEndpoint, payload).then(done, function () {
      c.sending = false; c.sendError = true; renderInline();
      var a = $('#fm-ci-root [role="alert"]'); if (a) a.scrollIntoView({ block: 'nearest' });
    });
  }

  function openContact() {
    opener = document.activeElement;
    state.contactOpen = true;
    state.cf.sent = false; state.cf.tried = false;
    renderContact();
    var d = $('#fm-contact-root .fm-dlg'); if (d) d.focus();
  }
  function closeContact() {
    state.contactOpen = false;
    renderContact();
    restoreFocus();
  }
  function submitContact() {
    var e = cfErrors();
    if (e.name || e.email || e.message) {
      state.cf.tried = true;
      renderContact();
      var first = $('#fm-contact-root [aria-invalid="true"]'); if (first) first.focus();
      return;
    }
    if (state.cf.sending) return;
    var d = state.cf.data;
    var done = function () {
      state.cf = { sent: true, tried: false, sending: false, sendError: false, data: { name: '', email: '', company: '', message: '' }, interests: [] };
      renderContact();
      var dlg = $('#fm-contact-root .fm-dlg'); if (dlg) dlg.focus();
    };
    if (isBot($('#fm-cf-form'))) { done(); return; }
    var payload = {
      _subject: 'formai: message from ' + String(d.name).trim(),
      name: String(d.name).trim(), email: String(d.email).trim(), company: String(d.company).trim(),
      interests: selectedInterests(state.cf.interests).join(', '),
      message: String(d.message).trim(),
      language: state.lang
    };
    state.cf.sending = true; state.cf.sendError = false;
    renderContact();
    postForm((window.FM_CONFIG || {}).contactEndpoint, payload).then(done, function () {
      state.cf.sending = false; state.cf.sendError = true;
      renderContact();
      var a = $('#fm-contact-root [role="alert"]'); if (a) a.scrollIntoView({ block: 'nearest' });
    });
  }


  /* ---------- audit request dialog ---------- */
  function normUrl(v) {
    v = String(v || '').trim();
    if (!v) return '';
    return /^https?:\/\//i.test(v) ? v : 'https://' + v;
  }
  function auErrors() {
    var tr = t(), d = state.au.data;
    var url = normUrl(d.url);
    return {
      url: /^https?:\/\/[^\s/$.?#]+\.[^\s]{2,}$/i.test(url) ? '' : tr.au.urlErr,
      email: EMAIL_RE.test(String(d.email).trim()) ? '' : tr.cf.errEmail
    };
  }
  function renderAudit() {
    var host = $('#fm-audit-root');
    if (!state.au.open) { host.innerHTML = ''; return; }
    var tr = t(), A = tr.au, cf = tr.cf, a = state.au, body;
    if (a.sent) {
      body = '<div role="status" style="display: flex; flex-direction: column; align-items: flex-start; gap: 20px; padding: 8px 0 4px;">' + EYE_DRAW +
        '<h2 id="fm-au-title" style="margin: 0; font-size: clamp(32px, 5vw, 48px); line-height: 1; font-weight: 200; letter-spacing: -0.03em;">' + esc(A.thanksTitle) + '</h2>' +
        '<p style="margin: 0; font-size: 16px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(A.thanksText) + '</p>' +
        '<button type="button" class="fm-btn fm-ck-btn fm-ck-primary" data-action="closeAudit" style="flex: none;">' + esc(cf.done) + '</button></div>';
    } else {
      var e = a.tried ? auErrors() : { url: '', email: '' };
      body = '<div style="display: flex; flex-direction: column; gap: 12px;"><h2 id="fm-au-title" style="margin: 0; font-size: clamp(32px, 5vw, 48px); line-height: 1; font-weight: 200; letter-spacing: -0.03em;">' + esc(A.title) + '</h2>' +
        '<p style="margin: 0; font-size: 15px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(A.intro) + '</p></div>' +
        ((e.url || e.email) ? errorSummary() : '') + (a.sendError ? sendErrorBox() : '') +
        '<form id="fm-au-form" novalidate style="position: relative; display: flex; flex-direction: column; gap: 20px; margin: 0;">' + HONEYPOT +
        field('fm-au-url', A.url, { key: 'url', required: true, type: 'url', ac: 'url', hint: A.urlHint, value: a.data.url, err: e.url }) +
        '<fieldset style="margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 10px; min-width: 0;"><legend class="fm-legend" style="padding: 0; margin-bottom: 10px;">' + esc(A.kind) + ' <span style="color: var(--muted); font-weight: 300;">(' + esc(cf.optional) + ')</span></legend>' +
        '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' + A.kinds.map(function (k, i) {
          var on = a.kind === i;
          return '<button type="button" class="fm-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-action="pickAuditKind" data-i="' + i + '">' + esc(k) + '</button>';
        }).join('') + '</div></fieldset>' +
        field('fm-au-email', cf.email, { key: 'email', required: true, type: 'email', ac: 'email', value: a.data.email, err: e.email }) +
        '<button type="button" class="fm-au-more" data-action="auMore" aria-expanded="' + !!a.more + '" aria-controls="fm-au-extra">' +
        '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6 H11 M6 1 V11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>' + esc(A.more) + '</button>' +
        '<div id="fm-au-extra" class="fm-au-extra"' + (a.more ? '' : ' hidden') + '>' +
        field('fm-au-name', cf.name, { key: 'name', ac: 'name', value: a.data.name }) +
        field('fm-au-company', cf.company, { key: 'company', ac: 'organization', value: a.data.company }) +
        field('fm-au-note', A.note, { key: 'note', textarea: true, rows: 3, hint: A.noteHint, value: a.data.note, style: 'min-height: 96px;' }) +
        '</div>' +
        privacyLine() +
        '<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;"><span style="' + LABEL + ' color: var(--muted);">' + esc(cf.required) + '</span>' +
        '<button type="submit" class="fm-btn fm-ck-btn fm-ck-primary" style="flex: none;"' + (a.sending ? ' disabled aria-busy="true"' : '') + '>' + submitLabel(A.send, a.sending) + '</button></div></form>';
    }
    host.innerHTML = '<div data-overlay="audit" style="' + OVERLAY + ' z-index: 140;">' +
      '<div class="fm-dlg" role="dialog" aria-modal="true" aria-labelledby="fm-au-title" tabindex="-1" style="' + DLG + ' max-width: 600px;">' +
      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;"><span style="' + LABEL + ' color: var(--accent);">' + esc(A.label) + '</span>' +
      '<button type="button" class="fm-mode" data-action="closeAudit" aria-label="' + esc(tr.ck.close) + '" style="' + BTN_SQ + '">' + ICON_CLOSE + '</button></div>' +
      body + '</div></div>';
  }
  function openAudit() {
    opener = document.activeElement;
    state.au.open = true; state.au.sent = false; state.au.tried = false; state.au.sendError = false;
    renderAudit();
    var u = $(String(state.au.data.url).trim() ? '#fm-au-email' : '#fm-au-url'); if (u) u.focus(); else { var d = $('#fm-audit-root .fm-dlg'); if (d) d.focus(); }
  }
  function closeAudit() {
    state.au.open = false;
    renderAudit();
    restoreFocus();
  }
  function submitAudit() {
    var a = state.au, e = auErrors();
    if (e.url || e.email) {
      a.tried = true; renderAudit();
      var first = $('#fm-audit-root [aria-invalid="true"]'); if (first) first.focus();
      return;
    }
    if (a.sending) return;
    var done = function () {
      state.au = { open: true, sent: true, tried: false, sending: false, sendError: false, kind: -1, data: { url: '', email: '', name: '', company: '', note: '' } };
      renderAudit();
      var dlg = $('#fm-audit-root .fm-dlg'); if (dlg) dlg.focus();
    };
    if (isBot($('#fm-au-form'))) { done(); return; }
    var url = normUrl(a.data.url);
    var payload = {
      _subject: 'formai: audit request ' + url,
      url: url,
      kind: a.kind >= 0 ? t().au.kinds[a.kind] : '',
      email: String(a.data.email).trim(), name: String(a.data.name).trim(), company: String(a.data.company).trim(),
      note: String(a.data.note).trim(),
      language: state.lang
    };
    a.sending = true; a.sendError = false; renderAudit();
    var cfg = window.FM_CONFIG || {};
    postForm(cfg.auditEndpoint || cfg.contactEndpoint, payload).then(done, function () {
      a.sending = false; a.sendError = true; renderAudit();
    });
  }

  /* ---------- booking calendar ---------- */
  var DAY = 86400000;
  var SLOT_STARTS = [];
  for (var sm = 11 * 60; sm < 20 * 60; sm += 30) SLOT_STARTS.push(sm);

  function helsinkiNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var g = function (ty) { return Number((parts.find(function (x) { return x.type === ty; }) || {}).value); };
      return { y: g('year'), m: g('month'), d: g('day'), h: g('hour') % 24, mi: g('minute') };
    } catch (err) {
      var n = new Date();
      return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), h: n.getHours(), mi: n.getMinutes() };
    }
  }

  function calModel() {
    var tr = t(), B = tr.bk, en = state.lang !== 'fi';
    var loc = en ? 'en-GB' : 'fi-FI', sep = en ? ':' : '.';
    var hel = helsinkiNow();
    var todayUTC = Date.UTC(hel.y, hel.m - 1, hel.d);
    var maxUTC = todayUTC + 60 * DAY;
    var nowMin = hel.h * 60 + hel.mi;
    var hhmm = function (m) { return String(Math.floor(m / 60)).padStart(2, '0') + sep + String(m % 60).padStart(2, '0'); };
    var freeSlots = function (ms) { return SLOT_STARTS.filter(function (m) { return ms > todayUTC || m >= nowMin + 60; }); };
    var isTaken = function (ms, m) { var d = TAKEN[new Date(ms).toISOString().slice(0, 10)]; return !!(d && d[key24(m)]); };
    var isOpen = function (ms) {
      var wd = new Date(ms).getUTCDay();
      return wd >= 1 && wd <= 5 && ms >= todayUTC && ms <= maxUTC &&
        freeSlots(ms).some(function (m) { return !isTaken(ms, m); });
    };
    var fmt = function (opts) { return new Intl.DateTimeFormat(loc, Object.assign({ timeZone: 'UTC' }, opts)); };
    var longDate = function (ms) { return fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms)); };
    var slotRange = function (m) { return hhmm(m) + '–' + hhmm(m + 30); };
    return { B: B, todayUTC: todayUTC, maxUTC: maxUTC, hhmm: hhmm, freeSlots: freeSlots, isTaken: isTaken, isOpen: isOpen, fmt: fmt, longDate: longDate, slotRange: slotRange, hel: hel };
  }

  /* Booked times, shared by every visitor through Supabase (see assets/js/config.js). */
  var TAKEN = {};
  var takenLoadedAt = 0;
  function key24(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function markTaken(date, time) { (TAKEN[date] = TAKEN[date] || {})[time] = true; }
  function sbConfig() { var c = window.FM_CONFIG || {}; return c.supabaseUrl && c.supabaseKey ? c : null; }
  function sbRequest(c, path, opts) {
    var h = { apikey: c.supabaseKey, 'Content-Type': 'application/json' };
    if (/^eyJ/.test(c.supabaseKey)) h.Authorization = 'Bearer ' + c.supabaseKey;
    return fetch(c.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + path, Object.assign({ headers: Object.assign(h, (opts && opts.headers) || {}) }, opts, { headers: Object.assign(h, (opts && opts.headers) || {}) }));
  }
  function loadTaken(force) {
    var c = sbConfig();
    if (!c || (!force && Date.now() - takenLoadedAt < 30000)) return;
    takenLoadedAt = Date.now();
    var from = new Date(calModel().todayUTC).toISOString().slice(0, 10);
    sbRequest(c, 'booked_slots?select=date,time&date=gte.' + from)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) {
        TAKEN = {};
        rows.forEach(function (row) { markTaken(row.date, row.time); });
        renderCalendar();
        if (state.bk.step !== 'details') renderPanel();
      })
      .catch(function () {});
  }
  // Claim a time for everyone. A second booking of the same time is refused by the database.
  function reserveSlot(date, time) {
    var c = sbConfig();
    if (!c) return Promise.resolve();
    return sbRequest(c, 'booked_slots', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ date: date, time: time }) })
      .then(function (r) {
        if (r.status === 409) { var e = new Error('taken'); e.taken = true; throw e; }
        if (!r.ok) throw new Error('HTTP ' + r.status);
      });
  }

  function capFirst(v) { v = String(v); return v.charAt(0).toUpperCase() + v.slice(1); }

  // The visitor's own time zone; local times are shown only when it differs from Helsinki.
  var VIS_TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } })();
  // The real moment of a Helsinki date (YYYY-MM-DD) and minute of the day.
  function helInstant(date, min) {
    var p = date.split('-').map(Number), guess = Date.UTC(p[0], p[1] - 1, p[2], Math.floor(min / 60), min % 60);
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(guess));
      var g = function (ty) { return Number((parts.find(function (x) { return x.type === ty; }) || {}).value); };
      var shown = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'));
      return guess - (shown - guess);
    } catch (e) { return guess - 2 * 3600000; }
  }
  // "18:00" (plus the weekday if the date differs) in the visitor's zone, or '' when it is Helsinki time anyway.
  function localTime(date, min, withEnd) {
    if (!VIS_TZ || VIS_TZ === 'Europe/Helsinki') return '';
    var at = helInstant(date, min), en = state.lang !== 'fi', loc = en ? 'en-GB' : 'fi-FI';
    try {
      var f = function (ms, o) { return new Intl.DateTimeFormat(loc, Object.assign({ timeZone: VIS_TZ }, o)).format(new Date(ms)); };
      var hm = { hour: '2-digit', minute: '2-digit', hour12: false };
      var a = f(at, hm), hel = new Intl.DateTimeFormat(loc, Object.assign({ timeZone: 'Europe/Helsinki' }, hm)).format(new Date(at));
      if (a === hel) return '';
      var dayL = f(at, { year: 'numeric', month: '2-digit', day: '2-digit' }), dayH = new Intl.DateTimeFormat(loc, { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(at));
      return (dayL !== dayH ? f(at, { weekday: 'short' }) + ' ' : '') + a + (withEnd ? '–' + f(at + 1800000, hm) : '');
    } catch (e) { return ''; }
  }
  function tzCity() { return VIS_TZ ? VIS_TZ.split('/').pop().replace(/_/g, ' ') : ''; }

  function bkSummary(M) {
    var b = state.bk;
    if (!b.date || !b.slot) return '';
    var ms = Date.parse(b.date + 'T00:00:00Z');
    var min = Number(b.slot);
    return M.longDate(ms) + ', ' + M.slotRange(min) + ' (' + M.B.tzNote + ')';
  }
  // A calendar file for the requested time, marked as to be confirmed.
  function icsHref(date, min) {
    var B = t().bk, start = helInstant(date, min), end = start + 1800000;
    var z = function (ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var e = function (v) { return String(v).replace(/\\/g, '\\\\').replace(/[,;]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//formai//booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + date + '-' + min + '-' + Date.now() + '@formai', 'DTSTAMP:' + z(Date.now()), 'DTSTART:' + z(start), 'DTEND:' + z(end),
      'SUMMARY:' + e(B.calTitle), 'DESCRIPTION:' + e(B.calDesc), 'STATUS:TENTATIVE', 'TRANSP:OPAQUE', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }
  function bkLocalLine(M) {
    var b = state.bk; if (!b.date || !b.slot) return '';
    var l = localTime(b.date, Number(b.slot), true);
    return l ? l + ' ' + M.B.yourTime + ' (' + tzCity() + ')' : '';
  }

  var bkNarrow = window.matchMedia('(max-width: 780px)');
  function dayId(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function openDays(M) {
    var out = [];
    for (var ms = M.todayUTC; ms <= M.maxUTC; ms += DAY) if (M.isOpen(ms)) out.push(ms);
    return out;
  }
  // The first free time of each of the next n open days.
  function nextFree(M, n) {
    return openDays(M).slice(0, n).map(function (ms) {
      var m = M.freeSlots(ms).filter(function (x) { return !M.isTaken(ms, x); })[0];
      return { ms: ms, date: dayId(ms), min: m };
    });
  }
  function quickDay(M, p) {
    var B = M.B;
    return p.ms === M.todayUTC ? B.today : p.ms === M.todayUTC + DAY ? B.tomorrow : capFirst(M.fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(p.ms)));
  }
  // Hero: "Next free call: Tomorrow 11:00", one click picks it in the booking form.
  function renderHeroNext(M, picks) {
    var el = $('#fm-hero-next');
    if (!el) return;
    var p = picks[0];
    if (!p) { el.hidden = true; return; }
    el.hidden = false;
    el.setAttribute('data-date', p.date); el.setAttribute('data-slot', String(p.min));
    el.setAttribute('data-action', 'heroNext');
    el.innerHTML = '<span class="fm-hero-dot" aria-hidden="true"></span><span>' + esc(t().heroNext.replace('{t}', quickDay(M, p) + ' ' + M.hhmm(p.min))) + '</span>' + ICON_ARROW;
    el.setAttribute('aria-label', t().heroNext.replace('{t}', capFirst(M.longDate(p.ms)) + ', ' + M.slotRange(p.min) + ' (' + M.B.tzNote + ')'));
  }
  function renderQuick() {
    var host = $('#fm-bk-quick');
    if (!host) return;
    var M = calModel(), B = M.B, b = state.bk;
    var picks = nextFree(M, 3);
    renderHeroNext(M, picks);
    if (!picks.length || b.step === 'done') { host.innerHTML = ''; return; }
    host.innerHTML = '<span class="fm-bk-quick-label">' + esc(B.quickLabel) + '</span>' +
      '<div class="fm-bk-quick-row">' + picks.map(function (p) {
        var day = quickDay(M, p);
        var sel = b.date === p.date && b.slot === String(p.min);
        return '<button type="button" class="fm-bk-pick' + (sel ? ' is-sel' : '') + '" data-action="quickSlot" data-date="' + p.date + '" data-slot="' + p.min + '" aria-pressed="' + sel + '"' +
          ' aria-label="' + esc(capFirst(M.longDate(p.ms)) + ', ' + M.slotRange(p.min) + ' (' + B.tzNote + ')') + '">' +
          '<span class="fm-bk-pick-day">' + esc(day) + '</span><span class="fm-bk-pick-time">' + esc(M.hhmm(p.min)) + '</span>' +
          (localTime(p.date, p.min) ? '<span class="fm-bk-local">' + esc(localTime(p.date, p.min) + ' ' + B.yourTime) + '</span>' : '') + ICON_ARROW + '</button>';
      }).join('') + '</div>';
  }
  function renderStrip(M) {
    var B = M.B, b = state.bk;
    var days = openDays(M);
    $('#fm-cal').innerHTML =
      '<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px;">' +
      '<h3 style="margin: 0; font-size: 24px; line-height: 1.2; font-weight: 300; letter-spacing: -0.02em;">' + esc(B.stripTitle) + '</h3>' +
      '<span style="' + MONO + ' font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);">' + esc(B.tzNote) + '</span></div>' +
      '<div class="fm-daystrip" role="group" aria-label="' + esc(B.stripTitle) + '">' + days.map(function (ms) {
        var id = dayId(ms), sel = id === b.date, d = new Date(ms);
        return '<button type="button" class="fm-sday' + (sel ? ' is-sel' : '') + (ms === M.todayUTC ? ' is-today' : '') + '" data-action="pickDay" data-date="' + id + '" aria-pressed="' + sel + '" aria-label="' + esc(capFirst(M.longDate(ms))) + '">' +
          '<span class="fm-sday-wd">' + esc(B.weekdays[(d.getUTCDay() + 6) % 7]) + '</span>' +
          '<span class="fm-sday-d">' + d.getUTCDate() + '</span>' +
          '<span class="fm-sday-m">' + esc(M.fmt({ month: 'short' }).format(d).replace('.', '')) + '</span></button>';
      }).join('') + '</div>';
    var strip = $('#fm-cal .fm-daystrip'), on = strip && strip.querySelector('.is-sel');
    if (on) strip.scrollLeft = Math.max(0, on.offsetLeft - strip.offsetLeft - 16);
  }
  // Phones: bring the times or the form into view after a choice above them.
  function bkReveal() {
    if (!bkNarrow.matches) return;
    var p = $('#fm-bk-panel'); if (!p) return;
    var r = p.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.55) window.scrollTo({ top: window.scrollY + r.top - 12, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  (function () {
    var re = function () { if ($('#fm-cal')) renderCalendar(); };
    if (bkNarrow.addEventListener) bkNarrow.addEventListener('change', re); else bkNarrow.addListener(re);
  })();

  function renderCalendar() {
    var M = calModel(), B = M.B, b = state.bk;
    renderQuick();
    if (bkNarrow.matches) { renderStrip(M); return; }
    var first = Date.UTC(M.hel.y, M.hel.m - 1 + b.calOff, 1);
    var fd = new Date(first);
    var cy = fd.getUTCFullYear(), cm = fd.getUTCMonth();
    var daysIn = new Date(Date.UTC(cy, cm + 1, 0)).getUTCDate();
    var lead = (fd.getUTCDay() + 6) % 7;
    var monthName = M.fmt({ month: 'long', year: 'numeric' }).format(fd);
    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    var prevDisabled = b.calOff <= 0;
    var nextDisabled = Date.UTC(cy, cm + 1, 1) > M.maxUTC;
    var cells = '';
    for (var i = 0; i < lead; i++) cells += '<span aria-hidden="true"></span>';
    for (var d = 1; d <= daysIn; d++) {
      var ms = Date.UTC(cy, cm, d);
      var open = M.isOpen(ms);
      var id = new Date(ms).toISOString().slice(0, 10);
      var sel = id === b.date;
      var cls = ['fm-day', open ? 'is-open' : '', sel ? 'is-sel' : '', ms === M.todayUTC ? 'is-today' : ''].join(' ').trim();
      cells += '<button type="button" class="' + cls + '"' + (open ? ' data-action="pickDay" data-date="' + id + '"' : ' disabled') +
        ' aria-pressed="' + sel + '" aria-label="' + esc(M.longDate(ms) + (open ? '' : ', ' + B.unavailable)) + '">' + d + '</button>';
    }
    var legend = MONO + ' font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);';
    $('#fm-cal').innerHTML =
      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">' +
      '<h3 aria-live="polite" style="margin: 0; font-size: 24px; line-height: 1.2; font-weight: 300; letter-spacing: -0.02em;">' + esc(monthName) + '</h3>' +
      '<div style="display: flex; gap: 8px;">' +
      '<button type="button" class="fm-mode" data-action="calPrev"' + (prevDisabled ? ' disabled' : '') + ' aria-label="' + esc(B.prev) + '" style="' + BTN_SQ + '">' + ICON_BACK + '</button>' +
      '<button type="button" class="fm-mode" data-action="calNext"' + (nextDisabled ? ' disabled' : '') + ' aria-label="' + esc(B.next) + '" style="' + BTN_SQ + '"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7 H12 M8 3 L12 7 L8 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg></button>' +
      '</div></div>' +
      '<div aria-hidden="true" style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px;">' +
      B.weekdays.map(function (w) { return '<span style="' + MONO + ' font-size: 11px; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); text-align: center; padding: 4px 0;">' + esc(w) + '</span>'; }).join('') + '</div>' +
      '<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px;">' + cells + '</div>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 20px; padding-top: 4px;">' +
      '<span style="display: inline-flex; align-items: center; gap: 8px; ' + legend + '"><svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M4 0 L8 4 L4 8 L0 4 Z" style="fill: var(--brand);"></path></svg>' + esc(B.legendOpen) + '</span>' +
      '<span style="display: inline-flex; align-items: center; gap: 8px; ' + legend + '"><span aria-hidden="true" style="display: inline-block; width: 12px; height: 12px; background: var(--ink);"></span>' + esc(B.legendSel) + '</span>' +
      '<span style="display: inline-flex; align-items: center; gap: 8px; ' + legend + '">' + esc(B.tzNote) + '</span></div>';
  }

  function renderPanel() {
    var M = calModel(), B = M.B, b = state.bk, cf = t().cf;
    var html = '';
    var step = b.step === 'done' ? 'done' : b.step === 'details' ? 'details' : b.date ? 'slots' : 'none';
    if (step === 'none') {
      html = '<div class="fm-bk-call">' +
        '<div style="display: flex; flex-direction: column; gap: 6px;"><span style="' + LABEL + ' color: var(--accent);">' + esc(B.callLabel) + '</span>' +
        '<h3 style="margin: 0; font-size: clamp(26px, 2.6vw, 32px); line-height: 1.1; font-weight: 300; letter-spacing: -0.02em;">' + esc(B.callTitle) + '</h3></div>' +
        '<ul class="fm-bk-points">' + B.callPoints.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<div class="fm-bk-meta">' + B.callMeta.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
        '<p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(B.callPick) + '</p></div>';
    } else if (step === 'slots') {
      var ms = Date.parse(b.date + 'T00:00:00Z');
      var selMin = b.slot ? Number(b.slot) : null;
      html = '<div style="display: flex; flex-direction: column; gap: 6px;"><span style="' + LABEL + ' color: var(--muted);">' + esc(B.slotsFor) + '</span>' +
        '<h3 style="margin: 0; font-size: 24px; line-height: 1.2; font-weight: 300; letter-spacing: -0.02em;">' + esc(capFirst(M.longDate(ms))) + '</h3></div>' +
        (b.takenNotice ? '<div role="alert" style="display: flex; align-items: center; gap: 12px; border: 1px solid var(--accent); padding: 12px 16px; font-size: 14px; line-height: 1.5; color: var(--ink);">' + ICON_ALERT + esc(B.takenNotice) + '</div>' : '') +
        (localTime(b.date, 11 * 60) ? '<span class="fm-bk-tzline">' + esc(B.tzNote + ' · ' + B.yourTime + ': ' + tzCity()) + '</span>' : '') +
        '<div role="group" aria-label="' + esc(B.slotsFor) + '" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">' +
        M.freeSlots(ms).map(function (m) {
          var id = String(m), sel = id === b.slot;
          if (M.isTaken(ms, m)) {
            return '<button type="button" class="fm-slot is-taken" disabled aria-label="' + esc(M.slotRange(m) + ', ' + B.taken) + '">' + esc(M.hhmm(m)) + '</button>';
          }
          return '<button type="button" class="fm-slot' + (sel ? ' is-sel' : '') + '" aria-pressed="' + sel + '" aria-label="' + esc(M.slotRange(m)) + '" data-action="pickSlot" data-slot="' + id + '">' + esc(M.hhmm(m)) + (localTime(b.date, m) ? '<span class="fm-slot-local">' + esc(localTime(b.date, m)) + '</span>' : '') + '</button>';
        }).join('') + '</div>' +
        '<div class="fm-bk-foot" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding-top: 16px; border-top: 1px solid var(--line); margin-top: auto;">' +
        '<span aria-live="polite" style="font-size: 15px; line-height: 1.4; font-weight: 400;">' + esc(b.slot && selMin != null ? M.slotRange(selMin) : B.noneYet) + (b.slot && bkLocalLine(M) ? '<span class="fm-bk-localline">' + esc(bkLocalLine(M)) + '</span>' : '') + '</span>' +
        '<button type="button" class="fm-btn fm-ck-btn fm-ck-primary" data-action="toDetails"' + (b.slot ? '' : ' disabled') + ' style="flex: none;">' + esc(B.cont) + ' ' + ICON_ARROW + '</button></div>';
    } else if (step === 'details') {
      var f = b.data;
      var eName = b.tried && !String(f.name).trim();
      var eEmail = b.tried && !EMAIL_RE.test(String(f.email).trim());
      html = '<button type="button" class="fm-link fm-textbtn" data-action="bkBack" style="align-self: flex-start;"><svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true" style="margin-right: 8px;"><path d="M13 7 H2 M6 3 L2 7 L6 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>' + esc(B.back) + '</button>' +
        '<div style="display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; border: 1px solid var(--line); background: var(--surface);"><span style="' + MONO + ' font-size: 11px; font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);">' + esc(B.selected) + '</span>' +
        '<span style="font-size: 16px; line-height: 1.4; font-weight: 400;">' + esc(bkSummary(M)) + '</span>' + (bkLocalLine(M) ? '<span class="fm-bk-localline">' + esc(bkLocalLine(M)) + '</span>' : '') + '</div>' +
        (eName || eEmail ? errorSummary() : '') + (b.sendError ? sendErrorBox() : '') +
        '<form id="fm-bk-form" novalidate style="position: relative; display: flex; flex-direction: column; gap: 18px; margin: 0;">' + HONEYPOT +
        field('fm-bk-name', cf.name, { key: 'name', required: true, ac: 'name', value: f.name, err: eName ? cf.errName : '' }) +
        field('fm-bk-email', cf.email, { key: 'email', required: true, type: 'email', ac: 'email', value: f.email, err: eEmail ? cf.errEmail : '' }) +
        '<fieldset class="fm-bk-topics"><legend class="fm-legend">' + esc(B.topic) + ' <span style="color: var(--muted); font-weight: 300;">(' + esc(cf.optional) + ')</span></legend>' +
        '<span class="fm-bk-topics-hint">' + esc(B.topicChipsLabel) + '</span><div>' + B.topicChips.map(function (x, k) {
          var on = !!(b.topics || [])[k];
          return '<button type="button" class="fm-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-action="bkTopic" data-i="' + k + '">' + esc(x) + '</button>';
        }).join('') + '</div></fieldset>' +
        field('fm-bk-topic', cf.message, { key: 'topic', textarea: true, rows: 3, value: f.topic, style: 'min-height: 96px;' }) +
        privacyLine() +
        '<button type="submit" class="fm-btn fm-ck-btn fm-ck-primary" style="flex: none; align-self: flex-start;"' + (b.sending ? ' disabled aria-busy="true"' : '') + '>' + submitLabel(B.confirm, b.sending) + '</button></form>';
    } else {
      html = '<div role="status" style="flex: 1; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 20px; min-height: 280px;">' + EYE_DRAW +
        '<h3 style="margin: 0; font-size: clamp(32px, 4vw, 44px); line-height: 1; font-weight: 200; letter-spacing: -0.03em;">' + esc(B.doneTitle) + '</h3>' +
        '<span style="font-size: 18px; line-height: 1.4; font-weight: 400;">' + esc(b.doneSummary) + '</span>' +
        (bkLocalLine(M) ? '<span class="fm-bk-localline">' + esc(bkLocalLine(M)) + '</span>' : '') +
        '<p style="margin: 0; font-size: 15px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(B.doneText) + '</p>' +
        '<div style="display: flex; flex-wrap: wrap; gap: 12px;">' + (b.date && b.slot ? '<a class="fm-btn fm-ck-btn fm-ck-primary" download="formai-call.ics" href="' + icsHref(b.date, Number(b.slot)) + '" style="flex: none;">' + esc(B.addCal) + ' ' + ICON_ARROW + '</a>' : '') +
        '<button type="button" class="fm-btn fm-ck-btn" data-action="bkAgain" style="flex: none;">' + esc(B.again) + '</button></div>' +
        '<p style="margin: 0; font-size: 14px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(B.changeNote) + '</p></div>';
    }
    $('#fm-bk-panel').innerHTML = html;
    renderQuick();
  }
  function renderBooking() { renderCalendar(); renderPanel(); }

  function submitBooking() {
    var b = state.bk, f = b.data;
    if (!String(f.name).trim() || !EMAIL_RE.test(String(f.email).trim())) {
      b.tried = true;
      renderPanel();
      var first = $('#fm-bk-panel [aria-invalid="true"]'); if (first) first.focus();
      return;
    }
    if (b.sending) return;
    var M = calModel();
    var summary = bkSummary(M);
    var done = function () {
      b.doneSummary = summary;
      b.step = 'done'; b.tried = false; b.sending = false; b.sendError = false;
      b.data = { name: '', email: '', company: '', topic: '' };
      b.interests = []; b.topics = [];
      renderPanel();
    };
    if (isBot($('#fm-bk-form'))) { done(); return; }
    var payload = {
      _subject: 'formai: booking request ' + b.date + ' ' + key24(Number(b.slot)) + ' (Europe/Helsinki)',
      booking: summary,
      date: b.date, time: key24(Number(b.slot)), duration: '30 min', timezone: 'Europe/Helsinki',
      name: String(f.name).trim(), email: String(f.email).trim(), company: String(f.company).trim(),
      interests: selectedInterests(b.interests).join(', '),
      topic: String(f.topic).trim(),
      topics: t().bk.topicChips.filter(function (_, k) { return (b.topics || [])[k]; }).join(', '),
      visitor_time: bkLocalLine(M), visitor_timezone: VIS_TZ,
      language: state.lang
    };
    var date = b.date, time = key24(Number(b.slot)), claim = date + ' ' + time;
    b.sending = true; b.sendError = false;
    renderPanel();
    // Reserve first so two visitors cannot book the same time; skip if this visitor already holds it.
    (b.reserved === claim ? Promise.resolve() : reserveSlot(date, time))
      .then(function () { b.reserved = claim; return postForm((window.FM_CONFIG || {}).bookingEndpoint, payload); })
      .then(function () {
        markTaken(date, time);
        b.reserved = '';
        done();
        renderCalendar();
      }, function (err) {
        b.sending = false;
        if (err && err.taken) {
          markTaken(date, time);
          b.slot = ''; b.step = 'slots'; b.takenNotice = true;
          renderBooking();
          var n = $('#fm-bk-panel [role="alert"]'); if (n) n.scrollIntoView({ block: 'nearest' });
          return;
        }
        b.sendError = true;
        renderPanel();
      });
  }


  /* ---------- AI news carousel ---------- */
  var news = Array.isArray(window.FM_NEWS) ? window.FM_NEWS : null;
  var newsArchive = [];
  function allNews() {
    var have = {};
    (news || []).forEach(function (x) { have[x.url] = true; });
    return (news || []).concat(newsArchive.filter(function (x) { return x && x.url && !have[x.url]; }));
  }
  var NEWS_LIKES = 'fm-news-likes', likes = {};
  try { if (allowPrefs) (JSON.parse(LS.get(NEWS_LIKES) || '[]') || []).forEach(function (u) { if (typeof u === 'string') likes[u] = true; }); } catch (e) {}
  function saveLikes() {
    var list = Object.keys(likes);
    if (!allowPrefs) return;
    if (list.length) LS.set(NEWS_LIKES, JSON.stringify(list)); else LS.del(NEWS_LIKES);
  }
  // Shared like counts for every visitor, from Supabase (docs/supabase-news-likes.sql).
  // Until that table exists the heart still works, just without a count.
  var COUNTS = {}, countsOn = false;
  function loadCounts() {
    var c = sbConfig();
    if (!c || !window.fetch) return;
    sbRequest(c, 'news_likes?select=url,likes')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (rows) {
        COUNTS = {}; countsOn = true;
        (rows || []).forEach(function (row) { if (row && row.url) COUNTS[row.url] = Number(row.likes) || 0; });
        syncLikes();
      })
      .catch(function () {});
  }
  function sendLike(u, d) {
    var c = sbConfig();
    if (!c || !countsOn) return;
    COUNTS[u] = Math.max(0, (COUNTS[u] || 0) + d); syncLikes();
    sbRequest(c, 'rpc/news_like', { method: 'POST', body: JSON.stringify({ u: u, d: d }) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (n) { if (typeof n === 'number') { COUNTS[u] = n; syncLikes(); } })
      .catch(function () { COUNTS[u] = Math.max(0, (COUNTS[u] || 0) - d); syncLikes(); });
  }
  function syncLikes() {
    var tr = t();
    $$('[data-news-like]').forEach(function (b) {
      var u = b.getAttribute('data-news-like'), on = !!likes[u], n = COUNTS[u] || 0;
      b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-on', on);
      b.title = on ? tr.newsLiked : tr.newsLike;
      if (!b.hasAttribute('data-label')) b.setAttribute('data-label', b.getAttribute('aria-label') || '');
      b.setAttribute('aria-label', b.getAttribute('data-label') + (n ? ' (' + tr.newsLikes.replace('{n}', n) + ')' : ''));
      var c = b.querySelector('.fm-news-like-n');
      if (n && !c) { c = document.createElement('span'); c.className = 'fm-news-like-n'; c.setAttribute('aria-hidden', 'true'); b.appendChild(c); }
      if (c) { if (n) c.textContent = n > 999 ? Math.floor(n / 100) / 10 + 'k' : String(n); else c.remove(); }
      b.classList.toggle('has-n', !!n);
    });
    $$('.fm-news-row').forEach(function (r) {
      var p = r.querySelector('[data-news-pick]'); r.classList.toggle('is-liked', !!(p && likes[p.getAttribute('data-news-pick')]));
    });
  }
  function renderNews() {
    var sec = $('#news'), root = $('#fm-news-root'), UI = window.FM_NEWS_UI;
    if (!sec || !root || !UI) return;
    if (!news || !news.length) { sec.hidden = true; return; }
    sec.hidden = false;
    var tr = t(), opts = { topic: state.newsTopic || '', all: !!state.newsAll, pick: state.newsPick || '' };
    var f = $('#fm-news-filters');
    if (f) { f.innerHTML = UI.filters(allNews(), tr, opts.topic); f.setAttribute('aria-label', tr.newsFilter); }
    var st = $('#fm-news-stamp'); if (st) st.textContent = UI.stamp(news, tr, state.lang);
    root.innerHTML = UI.layout(allNews(), tr, state.lang, opts);
    syncLikes();
  }
  document.addEventListener('click', function (ev) {
    var c = ev.target.closest && ev.target.closest('[data-news-topic]');
    if (c) { state.newsTopic = c.getAttribute('data-news-topic'); state.newsAll = false; state.newsPick = ''; renderNews(); var again = $('[data-news-topic="' + state.newsTopic + '"]'); if (again) again.focus(); return; }
    var lk = ev.target.closest && ev.target.closest('[data-news-like]');
    if (lk) {
      var u = lk.getAttribute('data-news-like');
      if (likes[u]) delete likes[u]; else likes[u] = true;
      saveLikes(); syncLikes(); sendLike(u, likes[u] ? 1 : -1);
      if (likes[u] && !reducedMotion) { lk.classList.remove('is-pop'); void lk.offsetWidth; lk.classList.add('is-pop'); }
      return;
    }
    var pk = ev.target.closest && ev.target.closest('[data-news-pick]');
    if (pk) {
      // A smaller article takes the lead story's place; the one it replaces goes back into the list.
      state.newsPick = pk.getAttribute('data-news-pick'); renderNews();
      var lead = $('#fm-news-lead');
      if (lead) {
        if (!reducedMotion) { lead.classList.remove('is-swap'); void lead.offsetWidth; lead.classList.add('is-swap'); }
        var top = lead.getBoundingClientRect().top, head = 88;
        if (top < head || top > innerHeight * 0.5) window.scrollTo({ top: scrollY + top - head, behavior: reducedMotion ? 'auto' : 'smooth' });
        var h = lead.querySelector('.fm-news-title'); if (h) h.focus({ preventScroll: true });
      }
      return;
    }
    var sh = ev.target.closest && ev.target.closest('[data-news-share]');
    if (sh) {
      // Share the article with our "For you" line: the share sheet where there is one, else copy both.
      var url = sh.getAttribute('data-news-share'), it = allNews().filter(function (x) { return x.url === url; })[0] || {};
      var tr = t(), tk = it.take && (it.take[state.lang] || it.take.en);
      var text = (tk ? tr.newsTake + ': ' + tk + ' (formai)' : it.title || '');
      if (navigator.share) { navigator.share({ title: it.title, text: text, url: url }).catch(function () {}); return; }
      var done = function () {
        var lab = sh.querySelector('span'); if (!lab) return;
        lab.textContent = tr.newsCopied; sh.classList.add('is-done');
        setTimeout(function () { lab.textContent = tr.newsShare; sh.classList.remove('is-done'); }, 2200);
      };
      var all = text + '\n' + url;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(all).then(done, function () { window.prompt('', all); });
      else window.prompt('', all);
      return;
    }
    var m = ev.target.closest && ev.target.closest('[data-news-more]');
    if (m) {
      var fromEnd = m.getAttribute('data-news-more') === 'end';
      state.newsAll = !state.newsAll; renderNews();
      var b2 = $('[data-news-more="side"]');
      if (b2) {
        b2.focus({ preventScroll: true });
        // Closing from the end of a long list: bring the button back into view.
        if (fromEnd) { var r = b2.getBoundingClientRect(); window.scrollTo({ top: window.scrollY + r.top - innerHeight * 0.4, behavior: reducedMotion ? 'auto' : 'smooth' }); }
      }
    }
  });
  function loadArchive() {
    if (!window.fetch) return;
    fetch(ASSETS + 'data/news-archive.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (list) { newsArchive = Array.isArray(list) ? list : []; if (newsArchive.length && news) renderNews(); })
      .catch(function () {});
  }
  function loadNews() {
    loadCounts(); loadArchive();
    if (news) { renderNews(); return; }
    if (!window.fetch) return;
    fetch(ASSETS + 'data/news.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (list) { news = Array.isArray(list) ? list : []; renderNews(); })
      .catch(function () {});
  }
  /* ---------- Sideways carousels (Work, AI news) ----------
     Each track scrolls sideways with snap points; buttons marked
     data-carousel="prev|next" data-target="<track id>" step one card, and the
     arrow keys work when the track has focus. Every track also drifts slowly on
     its own (~18 px/s), rests at the end and glides back to the start. It stops
     where it is while the visitor hovers, touches or focuses it, pauses a few
     seconds after the buttons, wheel or a swipe, and never runs while off screen,
     in a hidden tab, with paused animations or with reduced motion. */
  function carouselButtons(track) {
    if (!track) return;
    var max = track.scrollWidth - track.clientWidth - 2;
    $$('[data-carousel][data-target="' + track.id + '"]').forEach(function (b) {
      b.disabled = b.getAttribute('data-carousel') === 'prev' ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
  }
  function carouselStep(track, dir) {
    if (!track) return;
    var card = track.firstElementChild;
    var step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-carousel]');
    if (b && !b.disabled) carouselStep(document.getElementById(b.getAttribute('data-target')), b.getAttribute('data-carousel') === 'next' ? 1 : -1);
  });
  document.addEventListener('keydown', function (ev) {
    var tr = ev.target;
    if (tr && tr.classList && tr.classList.contains('fm-carousel') && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      ev.preventDefault(); carouselStep(tr, ev.key === 'ArrowRight' ? 1 : -1);
    }
  });

  function autoDrift(track) {
    var SPEED = 18, held = false, visible = false, resumeAt = 0, last = 0, pos = 0, waitUntil = 0;
    function canRun() {
      return visible && !held && !document.hidden && !state.paused && !reducedMotion &&
        Date.now() >= resumeAt && track.scrollWidth > track.clientWidth + 4;
    }
    function hold(ms) { resumeAt = Date.now() + ms; }
    function tick(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (canRun()) {
        var max = track.scrollWidth - track.clientWidth;
        if (!track.classList.contains('is-auto')) { track.classList.add('is-auto'); pos = track.scrollLeft; }
        if (Date.now() < waitUntil) {
          // resting at an end
        } else if (pos >= max - 1) {
          waitUntil = Date.now() + 2500;
          setTimeout(function () {
            if (!canRun()) return;
            track.scrollTo({ left: 0, behavior: 'smooth' });
            pos = 0; waitUntil = Date.now() + 2500;
          }, 2500);
        } else {
          pos = Math.min(max, pos + SPEED * dt);
          track.scrollLeft = pos;
        }
      } else if (track.classList.contains('is-auto') && (state.paused || reducedMotion)) {
        // Motion is off: give the visitor card snapping back.
        track.classList.remove('is-auto');
      }
      requestAnimationFrame(tick);
    }
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (e) {
      track.addEventListener(e, function () { held = true; }, { passive: true });
    });
    ['pointerleave', 'focusout'].forEach(function (e) {
      track.addEventListener(e, function () { held = false; hold(1500); pos = track.scrollLeft; });
    });
    track.addEventListener('touchend', function () { held = false; hold(5000); pos = track.scrollLeft; }, { passive: true });
    track.addEventListener('wheel', function () { hold(5000); pos = track.scrollLeft; }, { passive: true });
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-carousel]');
      if (b && b.getAttribute('data-target') === track.id) { hold(6000); setTimeout(function () { pos = track.scrollLeft; }, 700); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) pos = track.scrollLeft; }, { threshold: 0.3 }).observe(track);
    } else { visible = true; }
    requestAnimationFrame(tick);
  }

  $$('.fm-carousel').forEach(function (track) {
    track.addEventListener('scroll', function () { window.requestAnimationFrame(function () { carouselButtons(track); }); }, { passive: true });
    window.addEventListener('resize', function () { carouselButtons(track); });
    carouselButtons(track);
    if (!track.hasAttribute('data-no-drift')) autoDrift(track);
  });



  /* ---------- Footer social links from config.js ---------- */
  (function () {
    var social = (window.FM_CONFIG || {}).social || {};
    var any = false;
    $$('.fm-social').forEach(function (el) {
      var url = social[el.getAttribute('data-social')];
      // All icons show; an icon becomes a link once its profile address is set.
      el.hidden = false;
      if (url && /^https:\/\//.test(url)) { el.setAttribute('href', url); el.removeAttribute('aria-disabled'); any = true; }
      else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); }
    });
    var nav = $('.fm-socials'); if (nav) nav.hidden = false;
  })();

  /* ---------- Services picker ----------
     Wide screens: the list on the left picks which service the panel on the
     right shows (click, keyboard, or a short hover). Narrow screens: the same
     buttons open one service at a time, like an accordion. */
  var svcWide = window.matchMedia('(min-width: 901px)'), svcHover = 0;
  function pickService(item, fromClick) {
    clearTimeout(svcHover);
    if (!item) return;
    var wasOn = item.classList.contains('is-on');
    // On phones a second tap closes the open service; on wide screens one is always shown.
    var close = fromClick && wasOn && !svcWide.matches;
    $$('.fm-svc').forEach(function (el) {
      var on = el === item && !close;
      el.classList.toggle('is-on', on);
      var b = el.querySelector('.fm-svc-tab'); if (b) b.setAttribute('aria-expanded', String(on));
    });
    if (fromClick && !close && !wasOn && !svcWide.matches) {
      // Closing the service above shifts this one up; bring the opened service's
      // top back to the top of the screen so the whole card can be read downwards.
      var tab = item.querySelector('.fm-svc-tab');
      requestAnimationFrame(function () {
        var top = tab.getBoundingClientRect().top;
        if (Math.abs(top - 12) > 4) window.scrollTo({ top: window.scrollY + top - 12, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    }
  }
  (function () {
    $$('.fm-svc-tab').forEach(function (b) {
      b.addEventListener('pointerenter', function (ev) {
        if (ev.pointerType !== 'mouse' || !svcWide.matches) return;
        // Not while the page is scrolling to a service picked elsewhere (the list moves under the pointer).
        if (Date.now() < (window.__fmSvcHold || 0)) return;
        clearTimeout(svcHover);
        svcHover = setTimeout(function () { pickService(b.closest('.fm-svc'), false); }, 140);
      });
      b.addEventListener('pointerleave', function () { clearTimeout(svcHover); });
      // Arrow keys move between services in the list.
      b.addEventListener('keydown', function (ev) {
        var tabs = $$('.fm-svc-tab'), k = tabs.indexOf(b), to = -1;
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') to = (k + 1) % tabs.length;
        else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') to = (k + tabs.length - 1) % tabs.length;
        else if (ev.key === 'Home') to = 0;
        else if (ev.key === 'End') to = tabs.length - 1;
        if (to < 0) return;
        ev.preventDefault();
        tabs[to].focus();
        if (svcWide.matches) pickService(tabs[to].closest('.fm-svc'), false);
      });
    });
    // Going from phone to wide layout with nothing open: show the first service.
    var onChange = function () { if (svcWide.matches && !$('.fm-svc.is-on')) pickService($('.fm-svc'), false); };
    if (svcWide.addEventListener) svcWide.addEventListener('change', onChange); else svcWide.addListener(onChange);
  })();

  /* ---------- Work: before/after sliders, case counter and dots ----------
     Drag anywhere on a case's artwork (or use the arrow keys on its handle) to
     move the split between the old and the new design. The first time a case
     comes into view the split sweeps once to show it can be moved. */
  (function () {
    function setSplit(ba, v) {
      v = Math.max(0, Math.min(100, v));
      ba.style.setProperty('--split', v + '%');
      var h = ba.querySelector('.fm-ba-handle');
      h.setAttribute('aria-valuenow', String(Math.round(v)));
      h.setAttribute('aria-valuetext', Math.round(v) + '%');
      ba._v = v;
    }
    $$('.fm-ba').forEach(function (ba) {
      ba._v = 50;
      var drag = false;
      function fromX(x) { var r = ba.getBoundingClientRect(); setSplit(ba, (x - r.left) / r.width * 100); }
      ba.addEventListener('pointerdown', function (ev) {
        if (ev.button > 0) return;
        drag = true; ba._touched = true; ba.classList.add('is-drag');
        try { ba.setPointerCapture(ev.pointerId); } catch (e) {}
        fromX(ev.clientX);
      });
      ba.addEventListener('pointermove', function (ev) { if (drag) fromX(ev.clientX); });
      ['pointerup', 'pointercancel'].forEach(function (e) {
        ba.addEventListener(e, function () { drag = false; ba.classList.remove('is-drag'); });
      });
      var h = ba.querySelector('.fm-ba-handle');
      h.addEventListener('keydown', function (ev) {
        var step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 }[ev.key];
        if (ev.key === 'Home') step = -100; else if (ev.key === 'End') step = 100;
        if (step === undefined) return;
        ev.preventDefault(); ev.stopPropagation(); ba._touched = true;
        setSplit(ba, ba._v + step);
      });
    });
    // One sweep (50 -> 22 -> 78 -> 50) the first time each case is in view.
    function sweep(ba) {
      if (ba._swept || ba._touched || state.paused || reducedMotion) return;
      ba._swept = true;
      var keys = [50, 22, 78, 50], dur = 2200, t0 = 0;
      function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
      function frame(now) {
        if (ba._touched) return;
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / dur), seg = Math.min(2, Math.floor(p * 3)), f = ease(p * 3 - seg);
        setSplit(ba, keys[seg] + (keys[seg + 1] - keys[seg]) * f);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setTimeout(function () { if (e.target.getBoundingClientRect().right <= innerWidth + 1) sweep(e.target); }, 400); });
      }, { threshold: 0.9 });
      $$('.fm-ba').forEach(function (ba) { io.observe(ba); });
    }

    // Counter ("01 / 03") and dots follow the card that is in front.
    var track = $('#fm-work-track'), cur = $('#fm-work-cur');
    if (!track) return;
    var cards = $$('.fm-case', track), dots = $$('[data-work-dot]');
    function current() {
      var max = track.scrollWidth - track.clientWidth;
      // At the end of the track the last cards cannot reach the left edge: keep the one a dot asked for.
      if (track.scrollLeft >= max - 2) return track._want != null ? track._want : cards.length - 1;
      var best = 0, d = Infinity;
      cards.forEach(function (c, k) { var x = Math.abs(c.offsetLeft - track.offsetLeft - track.scrollLeft); if (x < d) { d = x; best = k; } });
      return best;
    }
    function update() {
      var k = current();
      if (cur) cur.textContent = ('0' + (k + 1)).slice(-2);
      dots.forEach(function (b, j) { b.classList.toggle('is-on', j === k); if (j === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    ['wheel', 'touchstart', 'pointerdown'].forEach(function (e) { track.addEventListener(e, function () { track._want = null; }, { passive: true }); });
    $$('[data-carousel][data-target="fm-work-track"]').forEach(function (btn) { btn.addEventListener('click', function () { track._want = null; }); });
    window.addEventListener('resize', update);
    dots.forEach(function (b) {
      b.addEventListener('click', function () {
        track._want = Number(b.getAttribute('data-work-dot'));
        var c = cards[track._want];
        track.scrollTo({ left: c.offsetLeft - track.offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });
    update();
  })();

  /* ---------- FAQ: search, topic groups, open all ----------
     Typing filters the questions (question and answer text) and marks the
     match in the question; a topic chip narrows the list too. With no match,
     "Ask us this" carries the visitor's words into the contact form. */
  var faqState = { q: '', group: '' };
  var FAQ_STOP = ['do', 'you', 'the', 'and', 'what', 'how', 'does', 'can', 'our', 'your', 'is', 'are', 'we', 'it', 'of', 'to', 'for', 'a', 'an', 'in', 'on', 'mita', 'miten', 'onko', 'voiko', 'te', 'teidan', 'me', 'ja', 'on', 'kuinka', 'paljonko', 'much', 'many', 'any', 'with', 'about', 'would', 'will', 'should', 'there', 'me', 'my', 'if', 'be', 'get', 'sign', 'kanssa', 'jos', 'ole', 'olla'];
  // Extra search words per question, in both languages (Finnish word endings change).
  var FAQ_KEYS = {
    'faq-cost': 'price prices pricing cost costs budget quote offer fee rate hinta hinnat hinnoittelu budjetti maksaa maksu kustannus kulut tarjous',
    'faq-time': 'time how long duration timeline schedule weeks days deadline fast aika kesto kestää kauanko aikataulu viikko viikot päivä päivät nopeasti',
    'faq-audit': 'audit free review fixes check auditointi maksuton ilmainen korjaus korjaukset tarkistus',
    'faq-ownership': 'own owner ownership code files rights ip copyright source omistus omistaa oikeudet tiedostot koodi lähdekoodi',
    'faq-ai': 'ai artificial intelligence agents chatgpt claude automation tekoäly agentit automaatio',
    'faq-data': 'data privacy gdpr security confidential personal nda secret tietosuoja tietoturva luottamuksellinen henkilötiedot salassapito',
    'faq-revisions': 'revisions revision changes feedback rounds edits korjauskierros korjauskierrokset muutos muutokset palaute',
    'faq-after-launch': 'maintenance support upkeep after launch updates hosting ylläpito tuki päivitys päivitykset julkaisu',
    'faq-team': 'team tools figma github integrate existing developers designers in-house tiimi työkalut integraatio kehittäjät suunnittelijat',
    'faq-languages': 'language languages finnish english swedish kieli kielet suomi suomeksi englanti englanniksi',
    'faq-size': 'size small startup enterprise company companies sme koko pieni yritys yritykset startup pk-yritys'
  };
  function faqNorm(v) { return String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function renderFaqTools() {
    var host = $('#fm-faq-groups'), tr = t(), U = tr.faqUi;
    if (!host || !U) return;
    var items = $$('.fm-faq-item[data-group]'), counts = {};
    items.forEach(function (d) { var g = d.getAttribute('data-group'); counts[g] = (counts[g] || 0) + 1; });
    var chip = function (g, label, n, cls) {
      var on = faqState.group === g;
      return '<button type="button" class="fm-chip fm-faq-chip' + (cls ? ' ' + cls : '') + (on ? ' is-on' : '') + '" data-faq-group="' + g + '" aria-pressed="' + on + '">' + esc(label) + ' <span>' + n + '</span></button>';
    };
    // "Most asked" sits right after All, in brand orange, and shows the questions tagged as most asked.
    var top = items.filter(function (d) { return d.querySelector('.fm-faq-top'); }).length;
    host.innerHTML = chip('', U.all, items.length) + (top ? chip('top', U.topChip || U.top, top, 'fm-faq-chip-top') : '') + Object.keys(U.groups).filter(function (g) { return counts[g]; }).map(function (g) { return chip(g, U.groups[g], counts[g]); }).join('');
    filterFaq();
  }
  function filterFaq() {
    var tr = t(), U = tr.faqUi, q = faqNorm(faqState.q).trim(), shown = 0;
    if (!U) return;
    $$('.fm-faq-item[data-group]').forEach(function (d) {
      var qSpan = d.querySelector('summary [data-i18n^="faq.q"]');
      var qText = get(tr, qSpan.getAttribute('data-i18n')) || '';
      var aEl = d.querySelector('[data-i18n^="faq.a"]'), aText = aEl ? get(tr, aEl.getAttribute('data-i18n')) || '' : '';
      var okG = !faqState.group || (faqState.group === 'top' ? !!d.querySelector('.fm-faq-top') : d.getAttribute('data-group') === faqState.group);
      // Every meaningful word of the search must appear somewhere in the question, answer or its search words.
      var hay = faqNorm(qText + ' ' + aText + ' ' + (FAQ_KEYS[d.id] || ''));
      var words = q.split(/[^a-z0-9\u00c0-\u024f-]+/).filter(function (w) { return w.length > 1 && FAQ_STOP.indexOf(w) === -1; });
      // Words match from their start ("own" finds "owns"); a Finnish ending on the search word is
      // allowed ("koodin" finds "koodi"), and a plural s is dropped ("NDAs" finds "NDA").
      var toks = hay.split(/[^a-z0-9\u00c0-\u024f]+/).filter(Boolean);
      var has = function (w) {
        var ws = w.length > 3 && /s$/.test(w) ? [w, w.slice(0, -1)] : [w];
        return toks.some(function (tk) {
          return ws.some(function (x) { return tk.indexOf(x) === 0 || (x.length >= 5 && tk.length >= 4 && x.indexOf(tk) === 0 && x.length - tk.length <= 3); });
        });
      };
      var okQ = !q || (words.length ? words.every(has) : hay.indexOf(q) !== -1);
      d.hidden = !(okG && okQ);
      if (!d.hidden) shown++;
      // Mark the match in the question (accent-insensitive, original letters kept).
      var at = q ? faqNorm(qText).indexOf(q) : -1;
      if (at >= 0) qSpan.innerHTML = esc(qText.slice(0, at)) + '<mark>' + esc(qText.slice(at, at + q.length)) + '</mark>' + esc(qText.slice(at + q.length));
      else qSpan.textContent = qText;
    });
    var cnt = $('#fm-faq-count'); if (cnt) cnt.textContent = shown === 1 ? U.count1 : U.count.replace('{n}', shown);
    var empty = $('#fm-faq-empty'), none = $('#fm-faq-none');
    if (empty) { empty.hidden = shown > 0; if (none) none.textContent = U.none.replace('{q}', faqState.q.trim()); }
    var all = $('#fm-faq-all');
    if (all) {
      var vis = $$('.fm-faq-item[data-group]').filter(function (d) { return !d.hidden; });
      var allOpen = vis.length && vis.every(function (d) { return d.open; });
      all.setAttribute('aria-pressed', String(!!allOpen));
      all.querySelector('span').textContent = allOpen ? U.closeAll : U.openAll;
      all.hidden = !vis.length;
    }
  }
  (function () {
    var input = $('#fm-faq-q');
    if (!input) return;
    input.addEventListener('input', function () { faqState.q = input.value; filterFaq(); });
    document.addEventListener('click', function (ev) {
      var g = ev.target.closest && ev.target.closest('[data-faq-group]');
      if (g) { faqState.group = g.getAttribute('data-faq-group'); renderFaqTools(); var again = $('[data-faq-group="' + faqState.group + '"]'); if (again) again.focus(); return; }
      if (ev.target.closest && ev.target.closest('#fm-faq-all')) {
        var vis = $$('.fm-faq-item[data-group]').filter(function (d) { return !d.hidden; });
        var open = !vis.every(function (d) { return d.open; });
        vis.forEach(function (d) { d.open = open; });
        filterFaq();
        return;
      }
      if (ev.target.closest && ev.target.closest('[data-faq-ask]')) {
        // The visitor's question goes into the contact form at the end of the page.
        state.ci.sent = false;
        state.ci.data.message = t().faqUi.askPrefix + faqState.q.trim() + '\n';
        renderInline();
        var ct = $('#contact'); if (ct) ct.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        var n = $('#fm-ci-name'); if (n) setTimeout(function () { n.focus({ preventScroll: true }); }, reducedMotion ? 0 : 600);
      }
    });
    $$('.fm-faq-item[data-group]').forEach(function (d) { d.addEventListener('toggle', filterFaq); });
    renderFaqTools();
  })();

  /* ---------- FAQ: a link per answer ----------
     Opening a question puts its address (#faq-cost etc.) in the URL without
     scrolling, so it can be shared; arriving with such an address opens that
     answer and scrolls to it. */
  (function () {
    var items = $$('.fm-faq-item[id]');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open && history.replaceState) history.replaceState(null, '', '#' + d.id);
      });
    });
    var fromHashSeen = false;
    function fromHash() {
      if (window.__fmReload && !fromHashSeen) { fromHashSeen = true; return; }
      var id = decodeURIComponent(location.hash.slice(1));
      if (!/^faq-/.test(id)) return;
      var d = document.getElementById(id);
      if (!d || d.tagName !== 'DETAILS') return;
      d.open = true;
      // After the page has settled (fonts, news), so the answer lands where intended.
      setTimeout(function () { d.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' }); }, 400);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  })();

  /* ---------- Audit: interactive sample ----------
     Hovering or focusing a fix lights up its marker on the page (and the
     other way round); "Show it fixed" swaps the page for the fixed one. The
     first time the card is in view it shows the fixed page once by itself. */
  (function () {
    var card = $('#fm-sa');
    if (!card) return;
    var toggle = card.querySelector('[data-sa-toggle]'), stateEl = card.querySelector('.fm-sa-state'), touched = false;
    function hot(n) {
      if (n) card.setAttribute('data-hot', n); else card.removeAttribute('data-hot');
      $$('.fm-sa-fix', card).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-fix') === String(n))); });
    }
    function setFixed(on) {
      card.classList.toggle('is-fixed', on);
      toggle.setAttribute('aria-pressed', String(on));
      if (stateEl) stateEl.textContent = on ? t().au.isFixed : t().au.isBefore;
    }
    $$('.fm-sa-fix', card).forEach(function (b) {
      var n = b.getAttribute('data-fix');
      b.addEventListener('pointerenter', function () { hot(n); });
      b.addEventListener('focus', function () { hot(n); });
      // Touch screens have no hover: a tap lights the fix up.
      b.addEventListener('click', function () { touched = true; hot(n); });
    });
    $$('.fm-sa-pin', card).forEach(function (g) { g.addEventListener('pointerenter', function () { hot(g.getAttribute('data-fix')); }); });
    card.addEventListener('pointerleave', function () { hot(''); });
    card.addEventListener('focusout', function (ev) { if (!card.contains(ev.relatedTarget)) hot(''); });
    toggle.addEventListener('click', function () { touched = true; setFixed(!card.classList.contains('is-fixed')); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        if (state.paused || reducedMotion) return;
        setTimeout(function () { if (!touched) setFixed(true); }, 1800);
        setTimeout(function () { if (!touched) setFixed(false); }, 5600);
      }, { threshold: 0.6 });
      io.observe(card);
    }
  })();

  /* ---------- Who we are: tool captions and the Helsinki clock ---------- */
  function setToolCap(k) {
    var cap = $('#fm-tools-cap'), tr = t();
    if (!cap) return;
    cap.textContent = k == null ? tr.toolsHint : tr.toolNames[k] + ': ' + tr.toolTips[k];
    cap.classList.toggle('is-on', k != null);
  }
  (function () {
    $$('.fm-tools-main [data-tool]').forEach(function (li) {
      var k = Number(li.getAttribute('data-tool'));
      li.addEventListener('pointerenter', function () { setToolCap(k); });
      li.addEventListener('focus', function () { setToolCap(k); });
      li.addEventListener('click', function () { setToolCap(k); });
    });
    // The copy in the second (decorative) track answers the pointer too.
    $$('.fm-tools-track[aria-hidden="true"] .fm-tool').forEach(function (li, k) {
      li.addEventListener('pointerenter', function () { setToolCap(k); });
    });
    var win = $('.fm-tools-window');
    if (win) win.addEventListener('pointerleave', function () { setToolCap(null); });
  })();
  function renderLive() {
    var el = $('#fm-live');
    if (!el) return;
    var h = helsinkiNow(), tr = t(), en = state.lang !== 'fi';
    var wd = new Date(Date.UTC(h.y, h.m - 1, h.d)).getUTCDay(), min = h.h * 60 + h.mi;
    var on = wd >= 1 && wd <= 5 && min >= 11 * 60 && min < 20 * 60;
    var time = String(h.h).padStart(2, '0') + (en ? ':' : '.') + String(h.mi).padStart(2, '0');
    el.innerHTML = '<span class="fm-live-dot' + (on ? ' is-on' : '') + '" aria-hidden="true"></span>' + esc((on ? tr.live.on : tr.live.off).replace('{t}', time));
    liveOn = on;
    var ct = $('#fm-ct-live');
    if (ct && tr.ci) ct.innerHTML = '<span class="fm-live-dot' + (on ? ' is-on' : '') + '" aria-hidden="true"></span>' + esc(on ? tr.ci.liveOn : tr.ci.liveOff);
  }
  var liveOn = false;
  renderLive();
  setInterval(renderLive, 30000);


  /* ---------- Who we work with: a picker of three kinds of team ---------- */
  function pickSeg(k, focus) {
    $$('.fm-seg-tab').forEach(function (b, j) {
      var on = j === k;
      b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$('.fm-seg-panel').forEach(function (p, j) { p.hidden = j !== k; });
  }
  document.addEventListener('click', function (ev) {
    var tab = ev.target.closest && ev.target.closest('.fm-seg-tab');
    if (tab) { pickSeg(Number(tab.getAttribute('data-seg'))); return; }
    var cs = ev.target.closest && ev.target.closest('[data-seg-case]');
    if (cs) {
      // Open the matching concept case in Work.
      var dot = $('[data-work-dot="' + cs.getAttribute('data-seg-case') + '"]'), w = $('#work');
      if (w) w.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (dot) setTimeout(function () { dot.click(); }, reducedMotion ? 0 : 500);
      return;
    }
    var talk = ev.target.closest && ev.target.closest('[data-seg-talk]');
    if (talk) {
      // The contact form at the end of the page, with the message already started.
      var seg = t().seg[Number(talk.getAttribute('data-seg-talk'))];
      state.ci.sent = false;
      if (!String(state.ci.data.message).trim()) state.ci.data.message = seg.msg;
      renderInline();
      var ct = $('#contact'); if (ct) ct.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { var m = $('#fm-ci-message'); if (m) { m.focus({ preventScroll: true }); m.setSelectionRange(m.value.length, m.value.length); } }, reducedMotion ? 0 : 600);
    }
  });
  document.addEventListener('keydown', function (ev) {
    var tab = ev.target.closest && ev.target.closest('.fm-seg-tab');
    if (!tab) return;
    var k = Number(tab.getAttribute('data-seg')), to = -1;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') to = (k + 1) % 3;
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') to = (k + 2) % 3;
    else if (ev.key === 'Home') to = 0; else if (ev.key === 'End') to = 2;
    if (to >= 0) { ev.preventDefault(); pickSeg(to, true); }
  });

  /* ---------- Who we are: the clickable loop, the founder's note and the team ---------- */
  function renderTeam() {
    var host = $('#fm-team'), tr = t(), C = window.FM_CONFIG || {}, T = C.team || {};
    if (!host) return;
    var preview = /[?&]team-preview\b/.test(location.search) && C.teamPreview;
    var real = (T.note && (T.note.en || T.note.fi)) || (T.people || []).some(function (p) { return p && (p.name || p.role); });
    if (!real && preview) T = C.teamPreview;
    var pick = function (v) { return v && (typeof v === 'string' || Array.isArray(v) ? v : (v[state.lang] || v.en)) || ''; };
    var note = pick(T.note), people = (T.people || []).filter(function (p) { return p && (p.name || p.role); });
    if (!note && !people.length) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    var safe = function (u) { return /^(assets\/|https:\/\/)/.test(String(u || '')) ? u : ''; };
    host.innerHTML = (!real && preview ? '<span class="fm-team-sample">' + esc(tr.teamPreview) + '</span>' : '') +
      (note ? '<figure class="fm-note"><span class="fm-team-label">' + esc(tr.noteLabel) + '</span><blockquote>' + esc(note) + '</blockquote>' +
        (T.noteBy ? '<figcaption>' + esc(T.noteBy) + '</figcaption>' : '') + '</figure>' : '') +
      (people.length ? '<div class="fm-people"><span class="fm-team-label">' + esc(tr.teamLabel) + '</span><ul>' + people.map(function (p) {
        var ph = safe(p.photo), role = pick(p.role), title = p.name || role;
        var frame = ph ? '<img src="' + esc(ph) + '" alt="" width="240" height="240" loading="lazy">'
          : '<span class="fm-photo" aria-hidden="true"><svg viewBox="0 0 144 144" focusable="false">' +
            '<rect x="0.5" y="0.5" width="143" height="143" style="fill: var(--raised); stroke: var(--line); stroke-width: 1;"></rect>' +
            '<path d="M24 78 H120 M72 30 V126" style="fill: none; stroke: var(--line); stroke-width: 1;"></path>' +
            '<rect x="56" y="40" width="32" height="32" style="fill: var(--surface); stroke: var(--strong); stroke-width: 1;"></rect>' +
            '<path d="M38 116 V102 Q38 88 52 88 H92 Q106 88 106 102 V116" style="fill: var(--surface); stroke: var(--strong); stroke-width: 1;"></path>' +
            '<path d="M72 96 L77 101 L72 106 L67 101 Z" style="fill: var(--brand);"></path>' +
            '<text x="12" y="20" style="font-family: \'DM Mono\', ui-monospace, monospace; font-size: 8px; letter-spacing: 0.12em; fill: var(--muted);">' + esc(tr.photoSoon) + '</text></svg></span>';
        return '<li class="fm-person">' + frame + '<div class="fm-person-body"><strong>' + esc(title) + '</strong>' +
          (p.name && role ? '<em>' + esc(role) + '</em>' : '') + (pick(p.line) ? '<p>' + esc(pick(p.line)) + '</p>' : '') +
          (pick(p.does) ? '<ul class="fm-person-does">' + pick(p.does).map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '') + '</div></li>';
      }).join('') + '</ul></div>' : '');
  }
  renderTeam();

  /* ---------- Footer: company details from config.js ---------- */
  function renderCompany() {
    var host = $('#fm-foot-company'), C = (window.FM_CONFIG || {}).company || {}, tr = t();
    if (!host) return;
    if (!C.name) { host.hidden = true; return; }
    host.hidden = false;
    var mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(C.email || '') ? '<a class="fm-foot-a" href="mailto:' + esc(C.email) + '">' + esc(C.email) + '</a>' : '';
    host.innerHTML = '<span class="fm-foot-h">' + esc(tr.foot.company) + '</span><address>' +
      '<strong>' + esc(C.name) + '</strong>' + (C.businessId ? '<span>' + esc(tr.foot.businessId) + ' ' + esc(C.businessId) + '</span>' : '') +
      (C.street ? '<span>' + esc(C.street) + '</span>' : '') + (C.city ? '<span>' + esc(C.city) + '</span>' : '') + mail + '</address>';
  }
  renderCompany();

  /* ---------- Footer motion ----------
     The columns arrive one after another once enough of the footer shows
     (with the curtain reveal the footer is behind the page from the start, so
     this goes by how far the page has lifted off it). "Back to top" sends a
     diamond up before the page scrolls. */
  (function () {
    var foot = $('.fm-footer'), main = $('main');
    if (!foot || !main) return;
    var raf = 0;
    function check() {
      raf = 0;
      if (foot.classList.contains('is-in')) return;
      if (main.offsetHeight < innerHeight) return;   // still loading: the page has no height yet
      var top = Math.max(foot.getBoundingClientRect().top, main.getBoundingClientRect().bottom);
      if (innerHeight - top > Math.min(foot.offsetHeight, innerHeight) * 0.3) foot.classList.add('is-in');
    }
    // Curtain: the footer stays put under the page. When it is taller than the
    // screen (phones) it is pinned by that overflow, so its top shows as the page
    // lifts off and the rest scrolls into view after.
    function pin() { foot.style.setProperty('--foot-pin', Math.min(0, innerHeight - foot.offsetHeight) + 'px'); }
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
    addEventListener('resize', function () { pin(); check(); });
    pin(); check();
    var link = $('[data-foot-top]');
    if (link) link.addEventListener('click', function (ev) {
      if (state.paused || reducedMotion) return;
      ev.preventDefault();
      link.classList.remove('is-go'); void link.offsetWidth; link.classList.add('is-go');
      setTimeout(function () { window.scrollTo({ top: 0, behavior: 'smooth' }); var c = $('#content'); if (c) c.focus({ preventScroll: true }); }, 380);
      setTimeout(function () { link.classList.remove('is-go'); }, 900);
    });
  })();

  /* ---------- full re-render (language / theme change) ---------- */
  function renderAll() {
    applyText();
    applyChrome();
    renderBanner();
    renderContact();
    renderInline();
    renderLive();
    setToolCap(null);
    renderTeam();
    renderCompany();
    renderFaqTools();
    renderAudit();
    renderDoc();
    renderBooking();
    renderNews();
  }

  function switchLang(lang) {
    save('fm-lang', lang);
    var page = document.documentElement.getAttribute('data-page-lang');
    if (page && page !== lang) {
      // Each language has its own address so search engines can index both.
      var path = location.pathname.replace(/index\.html$/, '');
      path = lang === 'fi' ? path.replace(/\/?$/, '/') + 'fi/' : path.replace(/fi\/$/, '');
      // Keep the visitor's place: remember the section in view and how far into
      // it they are, open the other page without the #part (which would make the
      // browser scroll down from the top), and restore the spot there at once.
      var secs = $$('main > section[id], main > [id]'), at = null;
      for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.bottom > 1) { at = { id: secs[i].id, off: Math.round(-r.top) }; break; } }
      // Past the last section (in the footer) the spot is simply the end of the page.
      SS.set('fm-lang-pos', JSON.stringify({ id: at && window.scrollY > 0 ? at.id : '', off: at ? at.off : 0, end: !at && window.scrollY > 0, hash: location.hash, mode: state.mode, paused: !!state.paused, t: Date.now() }));
      location.assign(path);
      return;
    }
    state.lang = lang;
    renderAll();
  }
  (function () {
    // Arriving from the language switch: back to the same spot, without scrolling there.
    var pos = null;
    try { pos = JSON.parse(SS.get('fm-lang-pos') || 'null'); } catch (e) {}
    if (!pos || Date.now() - pos.t > 15000) return;
    SS.set('fm-lang-pos', '');
    var html = document.documentElement, was = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    function place() {
      var el = pos.id && document.getElementById(pos.id);
      window.scrollTo(0, pos.end ? document.documentElement.scrollHeight : el ? Math.max(0, el.getBoundingClientRect().top + window.scrollY + pos.off) : 0);
    }
    place();
    requestAnimationFrame(place);
    addEventListener('load', place);
    setTimeout(function () {
      place();
      html.style.scrollBehavior = was;
      if (pos.hash && history.replaceState) history.replaceState(null, '', location.pathname + location.search + pos.hash);
    }, 400);
  })();

  /* ---------- actions ---------- */
  var actions = {
    toggleMode: function () { state.mode = state.mode === 'light' ? 'dark' : 'light'; save('fm-mode', state.mode); applyChrome(); },
    setEn: function () { switchLang('en'); },
    setFi: function () { switchLang('fi'); },
    togglePause: function () { state.paused = !state.paused; save('fm-paused', state.paused ? '1' : '0'); applyChrome(); },
    toggleMenu: function () { state.menuOpen = !state.menuOpen; applyChrome(); },
    closeMenu: function () { if (state.menuOpen) { state.menuOpen = false; applyChrome(); } },
    toggleCat: function (el) { var k = el.getAttribute('data-cat'); state.draft[k] = !state.draft[k]; renderBanner(); },
    acceptAll: function () { commitConsent(true, true, true); },
    rejectAll: function () { commitConsent(false, false, false); },
    confirmChoices: function () { commitConsent(state.draft.prefs, state.draft.analytics, state.draft.marketing); },
    ckMore: function () {
      state.ckMore = true; renderBanner();
      var b = $('#fm-banner-root .fm-cookie'); if (b) { b.setAttribute('tabindex', '-1'); b.focus({ preventScroll: true }); }
    },
    openSettings: function () {
      state.bannerOpen = true; state.ckMore = true;
      state.draft = { prefs: !!(consent && consent.prefs), analytics: !!(consent && consent.analytics), marketing: !!(consent && consent.marketing) };
      renderBanner();
      var b = $('#fm-banner-root .fm-cookie'); if (b) { b.setAttribute('tabindex', '-1'); b.focus(); }
    },
    openCookies: function () { openDoc('cookies'); },
    openPrivacy: function () { openDoc('privacy'); },
    closeDoc: closeDoc,
    openContact: openContact,
    openAudit: function (el, ev) { if (ev) ev.preventDefault(); if (state.menuOpen) { state.menuOpen = false; applyChrome(); } openAudit(); },
    closeAudit: closeAudit,
    pickAuditKind: function (el) {
      var i = Number(el.getAttribute('data-i'));
      state.au.kind = state.au.kind === i ? -1 : i;
      Array.prototype.forEach.call(document.querySelectorAll('#fm-audit-root [data-action="pickAuditKind"]'), function (b, j) {
        var on = j === state.au.kind; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
      });
    },
    closeContact: closeContact,
    auMore: function () {
      state.au.more = !state.au.more; renderAudit();
      var f = $(state.au.more ? '#fm-au-name' : '#fm-audit-root .fm-au-more'); if (f) f.focus();
    },
    ciStarter: function (el) {
      // Fill the message box with the starter, or add it on a new line after what is there.
      var C = t().ci, x = C.starters[Number(el.getAttribute('data-i'))], d = state.ci.data;
      var cur = String(d.message).trim();
      if (cur.indexOf(x) === -1) d.message = (!cur || C.starters.indexOf(cur) !== -1) ? x + ' ' : cur + '\n' + x + ' ';
      renderInline();
      var m = $('#fm-ci-message'); if (m) { m.focus(); m.setSelectionRange(m.value.length, m.value.length); }
    },
    ciMore: function () {
      state.ci.more = true; renderInline();
      var f = $('#fm-ci-link'); if (f) f.focus();
    },
    ciAgain: function () { state.ci.sent = false; renderInline(); var n = $('#fm-ci-name'); if (n) n.focus(); },
    pickService: function (el) { pickService(el.closest('.fm-svc'), true); },
    askService: function (el) {
      // Open the contact form with this service already chosen as the interest.
      var i = Number(el.getAttribute('data-i'));
      state.cf.interests = [];
      state.cf.interests[i] = true;
      openContact();
    },
    flipCard: function (el) {
      // Show the service name on orange in place of the animation; click again to flip back.
      var on = el.classList.toggle('is-flipped');
      var art = el.querySelector('.fm-art'); if (art) art.setAttribute('aria-pressed', String(on));
    },
    toggleInterest: function (el) {
      var list = el.getAttribute('data-form') === 'bk' ? state.bk.interests : state.cf.interests;
      var i = Number(el.getAttribute('data-i'));
      list[i] = !list[i];
      el.classList.toggle('is-on', list[i]);
      el.setAttribute('aria-pressed', String(list[i]));
    },
    calPrev: function () { state.bk.calOff = Math.max(0, state.bk.calOff - 1); renderCalendar(); },
    calNext: function () { state.bk.calOff += 1; renderCalendar(); },
    heroNext: function (el, ev) {
      if (ev) ev.preventDefault();
      actions.quickSlot(el);
      var bk = $('#book');
      if (bk && !bkNarrow.matches) bk.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    },
    heroService: function (el) {
      // A hero tile opens that service in the Services picker.
      var item = $$('.fm-svc')[Number(el.getAttribute('data-i'))];
      if (!item) return;
      window.__fmSvcHold = Date.now() + 4000; clearTimeout(svcHover);
      pickService(item, false);
      // One scroll to the right spot: the section on wide screens (list and panel side by side),
      // the chosen service's row on phones (its card opens below it). When the scroll settles,
      // check it arrived (content can shift on the way) and only then move focus.
      var tab = item.querySelector('.fm-svc-tab'), sec = $('#services');
      var target = function () {
        var el = svcWide.matches || !tab ? sec : tab;
        return el ? Math.max(0, Math.round(window.scrollY + el.getBoundingClientRect().top - (svcWide.matches ? 24 : 12))) : window.scrollY;
      };
      // html has scroll-behavior: smooth, which makes behavior 'auto' smooth too; switch it off to really jump.
      var jumpTo = function (y) { var h = document.documentElement, was = h.style.scrollBehavior; h.style.scrollBehavior = 'auto'; window.scrollTo(0, y); h.style.scrollBehavior = was; };
      var done = false, userMoved = false, settleT = 0, giveUp = 0;
      var stopEvents = ['touchstart', 'wheel', 'keydown'];
      var onUser = function () { userMoved = true; finish(); };
      var finish = function () {
        if (done) return; done = true;
        window.removeEventListener('scroll', onScroll);
        stopEvents.forEach(function (e) { window.removeEventListener(e, onUser); });
        clearTimeout(settleT); clearTimeout(giveUp);
        window.__fmSvcHold = Date.now() + 600;
        if (userMoved) return;   // the visitor took over: do not pull the page back
        var y = target();
        if (Math.abs(window.scrollY - y) > 6) jumpTo(y);
        if (tab) tab.focus({ preventScroll: true });
      };
      var onScroll = function () { clearTimeout(settleT); settleT = setTimeout(finish, 140); };
      var y0 = target();
      if (reducedMotion || Math.abs(window.scrollY - y0) < 4) { jumpTo(y0); finish(); return; }
      // A long smooth scroll gives the page time to shift (address bar, images) and reads as two
      // moves on phones. Jump to just short of the spot, then glide the last stretch.
      var lead = Math.round(Math.min(window.innerHeight * 0.6, 480)), from = window.scrollY;
      if (Math.abs(from - y0) > lead) {
        jumpTo(from > y0 ? y0 + lead : y0 - lead);
        y0 = target();
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      stopEvents.forEach(function (e) { window.addEventListener(e, onUser, { passive: true }); });
      giveUp = setTimeout(finish, 1500);
      requestAnimationFrame(function () { window.scrollTo({ top: y0, behavior: 'smooth' }); });
    },
    quickSlot: function (el) {
      var b = state.bk, M = calModel();
      b.date = el.getAttribute('data-date'); b.slot = el.getAttribute('data-slot');
      b.step = 'details'; b.tried = false; b.takenNotice = false;
      var d = new Date(Date.parse(b.date + 'T00:00:00Z'));
      b.calOff = (d.getUTCFullYear() - M.hel.y) * 12 + d.getUTCMonth() - (M.hel.m - 1);
      loadTaken();
      renderBooking();
      var n = $('#fm-bk-name'); if (n) n.focus({ preventScroll: bkNarrow.matches });
      bkReveal();
    },
    pickDay: function (el) {
      var b = state.bk; b.date = el.getAttribute('data-date'); b.slot = ''; b.step = 'slots'; b.takenNotice = false;
      loadTaken();
      renderBooking();
      var again = $('#fm-cal [data-date="' + b.date + '"]'); if (again) again.focus({ preventScroll: true });
      bkReveal();
    },
    pickSlot: function (el) {
      state.bk.slot = el.getAttribute('data-slot'); state.bk.takenNotice = false;
      renderPanel();
      var again = $('#fm-bk-panel [data-slot="' + state.bk.slot + '"]'); if (again) again.focus();
    },
    toDetails: function () {
      if (!state.bk.slot) return;
      state.bk.step = 'details'; state.bk.tried = false; renderPanel();
      var n = $('#fm-bk-name'); if (n) n.focus({ preventScroll: bkNarrow.matches });
      bkReveal();
    },
    bkBack: function () { state.bk.step = 'slots'; renderPanel(); },
    bkTopic: function (el) {
      var b = state.bk, k = Number(el.getAttribute('data-i'));
      b.topics = b.topics || []; b.topics[k] = !b.topics[k];
      el.classList.toggle('is-on', b.topics[k]); el.setAttribute('aria-pressed', String(b.topics[k]));
    },
    bkAgain: function () { var b = state.bk; b.step = ''; b.date = ''; b.slot = ''; b.doneSummary = ''; renderBooking(); }
  };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-action]');
    if (el && !el.disabled && actions[el.getAttribute('data-action')]) {
      actions[el.getAttribute('data-action')](el, ev);
      return;
    }
    // Click on the dim overlay (outside the dialog) closes it.
    var ov = ev.target.getAttribute && ev.target.getAttribute('data-overlay');
    if (ov === 'doc') closeDoc();
    else if (ov === 'contact') closeContact();
    else if (ov === 'audit') closeAudit();
  });

  document.addEventListener('input', function (ev) {
    var el = ev.target, key = el.getAttribute && el.getAttribute('data-field');
    if (!key) return;
    if (el.closest('#fm-cf-form')) state.cf.data[key] = el.value;
    else if (el.closest('#fm-ci-form')) { state.ci.data[key] = el.value; ciSaveDraft(); }
    else if (el.closest('#fm-bk-form')) state.bk.data[key] = el.value;
    else if (el.closest('#fm-au-form')) state.au.data[key] = el.value;
  });

  document.addEventListener('submit', function (ev) {
    if (ev.target.id === 'fm-cf-form') { ev.preventDefault(); submitContact(); }
    else if (ev.target.id === 'fm-ci-form') { ev.preventDefault(); submitInline(); }
    else if (ev.target.id === 'fm-bk-form') { ev.preventDefault(); submitBooking(); }
    else if (ev.target.id === 'fm-au-form') { ev.preventDefault(); submitAudit(); }
    else if (ev.target.id === 'fm-hero-start') {
      ev.preventDefault();
      var hv = String(($('#fm-hero-url') || {}).value || '').trim();
      if (hv) state.au.data.url = hv;
      openAudit();
    }
    else if (ev.target.id === 'fm-au-start') {
      // 1) The one-field start: carry the address into the audit dialog.
      ev.preventDefault();
      var v = String(($('#fm-au-start-url') || {}).value || '').trim();
      if (v) state.au.data.url = v;
      openAudit();
    }
  });

  document.addEventListener('keydown', function (ev) {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('fm-art')) {
      ev.preventDefault();
      var card = ev.target.closest('.fm-card'); if (card) actions.flipCard(card);
      return;
    }
    if (ev.key === 'Escape') {
      if (state.dialog) { closeDoc(); return; }
      if (state.au.open) { closeAudit(); return; }
      if (state.contactOpen) { closeContact(); return; }
      if (state.menuOpen) { state.menuOpen = false; applyChrome(); }
      return;
    }
    if (ev.key === 'Tab') {
      // Keep keyboard focus inside an open modal dialog.
      var dlg = state.dialog ? $('#fm-doc-root .fm-dlg') : state.au.open ? $('#fm-audit-root .fm-dlg') : state.contactOpen ? $('#fm-contact-root .fm-dlg') : null;
      if (!dlg) return;
      var f = $$('button:not([disabled]), input, textarea, a[href]', dlg);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && (document.activeElement === first || document.activeElement === dlg)) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
  });

  /* ---------- start at the top ----------
     Browsers restore the old scroll position on a reload, so after the loading
     animation the page could open halfway down. A load without a #section in the
     address (and not from the language switch, which keeps its own spot) opens at
     the top of the hero. */
  var fromSwitch = !!carried;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function toTop() {
    if (fromSwitch || (location.hash.length > 1 && !window.__fmReload)) return;
    var html = document.documentElement, was = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); html.style.scrollBehavior = was;
  }
  toTop();
  addEventListener('load', toTop);

  /* ---------- loader ---------- */
  function startLoader() {
    var loader = $('#fm-loader');
    var showLoader = !reducedMotion && SS.get('fm-seen') !== '1';
    function done() {
      if (state.ready) return;
      state.ready = true;
      SS.set('fm-seen', '1');
      loader.classList.add('is-done');
      applyChrome();
      renderBanner();
      toTop();
    }
    if (!showLoader) { loader.classList.add('is-off'); done(); return; }
    var start = Date.now();
    var finish = function () { setTimeout(done, Math.max(0, 1000 - (Date.now() - start))); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(finish, finish); else finish();
    setTimeout(done, 4000);
  }

  var yr = $('#fm-year'); if (yr) yr.textContent = String(new Date().getFullYear());
  renderAll();
  loadNews();
  loadTaken(true);
  startLoader();
})();
