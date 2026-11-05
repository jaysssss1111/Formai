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

  var sysMode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  var navLang = String(navigator.language || '').toLowerCase().indexOf('fi') === 0 ? 'fi' : '';

  var state = {
    mode: (allowPrefs && LS.get('fm-mode')) || sysMode || 'dark',
    // Prerendered pages (/ and /fi/) carry their language; the template falls back to prefs.
    lang: document.documentElement.getAttribute('data-page-lang') || (allowPrefs && LS.get('fm-lang')) || navLang || 'en',
    paused: allowPrefs && LS.get('fm-paused') === '1',
    menuOpen: false,
    bannerOpen: !consent,
    draft: { prefs: !!(consent && consent.prefs), analytics: !!(consent && consent.analytics), marketing: !!(consent && consent.marketing) },
    dialog: '',
    contactOpen: false,
    au: { open: false, sent: false, tried: false, sending: false, sendError: false, kind: -1, more: false, data: { url: '', email: '', name: '', company: '', note: '' } },
    cf: { sent: false, tried: false, sending: false, sendError: false, data: { name: '', email: '', company: '', message: '' }, interests: [] },
    ci: { sent: false, tried: false, sending: false, sendError: false, data: { name: '', email: '', message: '' } },
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
    var ticker = $('#fm-ticker');
    if (ticker) {
      ticker.innerHTML = tr.ticker.concat(tr.ticker).map(function (w) {
        return '<span style="display: inline-flex; align-items: center; gap: 40px; padding-right: 40px; font-size: 36px; line-height: 1; font-weight: 200; letter-spacing: -0.02em; color: var(--ink); white-space: nowrap;">' + esc(w) +
          '<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M5 0 L10 5 L5 10 L0 5 Z" style="fill: var(--brand)"></path></svg></span>';
      }).join('');
    }
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
    } else {
      ['fm-mode', 'fm-lang', 'fm-paused'].forEach(LS.del);
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
  function ciErrors() {
    var tr = t().cf, f = state.ci.data;
    return {
      name: String(f.name).trim() ? '' : tr.errName,
      email: EMAIL_RE.test(String(f.email).trim()) ? '' : tr.errEmail,
      message: String(f.message).trim().length >= 10 ? '' : tr.errMessage
    };
  }
  function renderInline() {
    var host = $('#fm-ci-root');
    if (!host) return;
    var tr = t(), cf = tr.cf, C = tr.ci, c = state.ci;
    if (c.sent) {
      host.innerHTML = '<div role="status" class="fm-ci-done" tabindex="-1">' + EYE_DRAW +
        '<h3 style="margin: 0; font-size: clamp(28px, 3.4vw, 40px); line-height: 1.05; font-weight: 200; letter-spacing: -0.03em;">' + esc(cf.thanksTitle) + '</h3>' +
        '<p style="margin: 0; font-size: 16px; line-height: 1.6; font-weight: 300; color: var(--muted);">' + esc(cf.thanksText) + '</p>' +
        '<button type="button" class="fm-btn fm-ck-btn" data-action="ciAgain" style="flex: none;">' + esc(C.again) + '</button></div>';
      return;
    }
    var e = c.tried ? ciErrors() : { name: '', email: '', message: '' };
    var hasErr = !!(e.name || e.email || e.message);
    var msg = String(c.data.message).trim();
    host.innerHTML =
      '<h3 class="fm-ci-title">' + esc(C.formTitle) + '</h3>' +
      (hasErr ? errorSummary() : '') + (c.sendError ? sendErrorBox() : '') +
      '<form id="fm-ci-form" novalidate style="position: relative; display: flex; flex-direction: column; gap: 18px; margin: 0;">' + HONEYPOT +
      '<div class="fm-ci-row">' +
      field('fm-ci-name', cf.name, { key: 'name', required: true, ac: 'name', value: c.data.name, err: e.name }) +
      field('fm-ci-email', cf.email, { key: 'email', required: true, type: 'email', ac: 'email', value: c.data.email, err: e.email }) +
      '</div>' +
      '<div class="fm-ci-starters" role="group" aria-label="' + esc(C.startersLabel) + '"><span>' + esc(C.startersLabel) + '</span><div>' +
      C.starters.map(function (x, k) {
        var on = msg.indexOf(x) !== -1;
        return '<button type="button" class="fm-chip' + (on ? ' is-on' : '') + '" aria-pressed="' + on + '" data-action="ciStarter" data-i="' + k + '">' + esc(x) + '</button>';
      }).join('') + '</div></div>' +
      field('fm-ci-message', cf.message, { key: 'message', required: true, textarea: true, rows: 4, hint: cf.messageHint, value: c.data.message, err: e.message }) +
      privacyLine() +
      '<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;"><span style="' + LABEL + ' color: var(--muted);">' + esc(cf.required) + '</span>' +
      '<button type="submit" class="fm-btn fm-ck-btn fm-ck-primary" style="flex: none;"' + (c.sending ? ' disabled aria-busy="true"' : '') + '>' + submitLabel(cf.send, c.sending) + '</button></div></form>';
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
      state.ci = { sent: true, tried: false, sending: false, sendError: false, data: { name: '', email: '', message: '' } };
      renderInline();
      var s2 = $('#fm-ci-root .fm-ci-done'); if (s2) s2.focus();
    };
    if (isBot($('#fm-ci-form'))) { done(); return; }
    var payload = {
      _subject: 'formai: message from ' + String(d.name).trim(),
      name: String(d.name).trim(), email: String(d.email).trim(),
      message: String(d.message).trim(),
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
  function renderNews() {
    var sec = $('#news'), root = $('#fm-news-root'), UI = window.FM_NEWS_UI;
    if (!sec || !root || !UI) return;
    if (!news || !news.length) { sec.hidden = true; return; }
    sec.hidden = false;
    var tr = t(), opts = { topic: state.newsTopic || '', all: !!state.newsAll };
    var f = $('#fm-news-filters');
    if (f) { f.innerHTML = UI.filters(news, tr, opts.topic); f.setAttribute('aria-label', tr.newsFilter); }
    var st = $('#fm-news-stamp'); if (st) st.textContent = UI.stamp(news, tr, state.lang);
    root.innerHTML = UI.layout(news, tr, state.lang, opts);
  }
  document.addEventListener('click', function (ev) {
    var c = ev.target.closest && ev.target.closest('[data-news-topic]');
    if (c) { state.newsTopic = c.getAttribute('data-news-topic'); state.newsAll = false; renderNews(); var again = $('[data-news-topic="' + state.newsTopic + '"]'); if (again) again.focus(); return; }
    var m = ev.target.closest && ev.target.closest('[data-news-more]');
    if (m) {
      state.newsAll = !state.newsAll; renderNews();
      var b2 = $('[data-news-more]'); if (b2) b2.focus();
    }
  });
  function loadNews() {
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


  /* ---------- Footer: the eye looks at the pointer; the wordmark rises in ---------- */
  (function () {
    var foot = $('.fm-footer'), eye = $('.fm-foot-eye'), pupil = $('.fm-foot-pupil');
    if (!foot) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) foot.classList.add('is-in'); }, { threshold: 0.2 }).observe(foot);
    } else { foot.classList.add('is-in'); }
    if (!eye || !pupil) return;
    var raf = 0, px = 0, py = 0;
    document.addEventListener('pointermove', function (ev) {
      if (state.paused || reducedMotion) return;
      px = ev.clientX; py = ev.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = eye.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;   // only while the footer is near
        var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 240);
        // Up to 9 units sideways and 5 up/down in the 64-unit eye.
        pupil.setAttribute('transform', 'translate(' + (dx / d * 9 * k).toFixed(2) + ' ' + (dy / d * 5 * k).toFixed(2) + ')');
      });
    }, { passive: true });
  })();

  /* ---------- Footer social links from config.js ---------- */
  (function () {
    var social = (window.FM_CONFIG || {}).social || {};
    $$('.fm-social').forEach(function (el) {
      var url = social[el.getAttribute('data-social')];
      if (url && /^https:\/\//.test(url)) el.setAttribute('href', url);
      else { el.removeAttribute('href'); el.setAttribute('aria-disabled', 'true'); }
    });
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
      if (track.scrollLeft >= max - 2) return cards.length - 1;
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
    window.addEventListener('resize', update);
    dots.forEach(function (b) {
      b.addEventListener('click', function () {
        var c = cards[Number(b.getAttribute('data-work-dot'))];
        track.scrollTo({ left: c.offsetLeft - track.offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });
    update();
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
    function fromHash() {
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
  }
  renderLive();
  setInterval(renderLive, 30000);

  /* ---------- full re-render (language / theme change) ---------- */
  function renderAll() {
    applyText();
    applyChrome();
    renderBanner();
    renderContact();
    renderInline();
    renderLive();
    setToolCap(null);
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
      location.assign(path + location.hash);
      return;
    }
    state.lang = lang;
    renderAll();
  }

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
    openSettings: function () {
      state.bannerOpen = true;
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
      pickService(item, false);
      var sec = $('#services');
      if (sec) sec.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      var tab = item.querySelector('.fm-svc-tab'); if (tab) setTimeout(function () { tab.focus({ preventScroll: true }); }, reducedMotion ? 0 : 500);
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
    else if (el.closest('#fm-ci-form')) state.ci.data[key] = el.value;
    else if (el.closest('#fm-bk-form')) state.bk.data[key] = el.value;
    else if (el.closest('#fm-au-form')) state.au.data[key] = el.value;
  });

  document.addEventListener('submit', function (ev) {
    if (ev.target.id === 'fm-cf-form') { ev.preventDefault(); submitContact(); }
    else if (ev.target.id === 'fm-ci-form') { ev.preventDefault(); submitInline(); }
    else if (ev.target.id === 'fm-bk-form') { ev.preventDefault(); submitBooking(); }
    else if (ev.target.id === 'fm-au-form') { ev.preventDefault(); submitAudit(); }
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
