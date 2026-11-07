/* formai — method film.
 * A 27-second scripted animation under the Method section:
 * 01 audit (0–9 s) → 02 sprint (9–18 s) → 03 ship (18–27 s).
 * Everything is drawn in one inline SVG and driven by a single timeline,
 * so the story can be paused, scrubbed by chapter and translated.
 * Copy lives in assets/js/i18n.js under `film`.
 */
(function () {
  'use strict';

  var host = document.getElementById('fm-film');
  if (!host || !window.FM_I18N) return;
  var root = document.getElementById('top');

  /* ---------- timeline constants ---------- */
  var DUR = 27;
  var CH = [0, 9, 18];
  var END_AT = 24.8;
  var POSTER = 6.6;
  var MK = [[230, 431], [346, 304], [550, 200]];   // audit markers on the client's screen
  var Q = [[400, 270], [480, 270], [560, 270]];    // tasks inside the sprint loop
  var BD = [[396, 249], [506, 312], [690, 195]];   // fixed items on the shipped screen
  var MK_T = [3.0, 3.6, 4.2];
  var DONE_T = [11.6, 13.1, 14.6];
  var FILE_T = [11.9, 13.4, 14.9];
  var FILE_X = [300, 425, 550];
  // Phones: a taller canvas with labels about 2.2x larger, the side lists moved under the screens,
  // so the words inside the film can be read (they were 5-7 px). Desktop is unchanged.
  var MQ = window.matchMedia ? window.matchMedia('(max-width: 640px)') : null;
  var compact = false;
  function fileX(i) { return compact ? [236, 402, 568][i] : FILE_X[i]; }
  function chipY() { return compact ? 664 : 456; }

  /* ---------- math ---------- */
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function k(t, a, b) { return clamp((t - a) / (b - a)); }
  function E(p) { return 1 - Math.pow(1 - p, 3); }
  function ek(t, a, b) { return E(k(t, a, b)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function win(t, a, b, c, d) { return Math.min(ek(t, a, b), c == null ? 1 : 1 - ek(t, c, d)); }
  function f2(v) { return Math.round(v * 100) / 100; }

  /* ---------- text ---------- */
  function lang() { return document.documentElement.lang === 'fi' ? 'fi' : 'en'; }
  function tx() { var L = lang(); return Object.assign({}, window.FM_I18N.T[L], window.FM_I18N.LEGAL[L]); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- markup ---------- */
  var MONO = "font-family: 'DM Mono', ui-monospace, monospace;";
  var SANS = "font-family: 'DM Sans', system-ui, sans-serif;";
  var DIAMOND = 'M0 -12 L12 0 L0 12 L-12 0 Z';
  var ICONS = {
    play: '<svg class="fm-film-i-play" width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1 L11 6 L2 11 Z" style="fill: currentColor;"></path></svg>',
    pause: '<svg class="fm-film-i-pause" width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1 V11 M9 1 V11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>',
    replay: '<svg class="fm-film-i-replay" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8 A5 5 0 1 0 5 4 M5 1 V4.5 H1.5" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square; stroke-linejoin: miter;"></path></svg>',
    arrow: '<svg class="fm-arrow" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7 H12 M8 3 L12 7 L8 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>'
  };

  function label(x, y, text, opts) {
    opts = opts || {};
    return '<text x="' + x + '" y="' + y + '"' + (opts.anchor ? ' text-anchor="' + opts.anchor + '"' : '') +
      ' style="' + MONO + ' font-size: ' + f2((opts.size || 14) * (compact ? 2.2 : 1)) + 'px; letter-spacing: ' + (compact ? '0.03em' : (opts.ls || '0.1em')) + '; fill: var(--' + (opts.color || 'muted') + ');">' + esc(text) + '</text>';
  }
  function box(x, y, w, h, color, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" style="fill: var(--' + color + ');' + (extra || '') + '"></rect>';
  }
  function outline(x, y, w, h) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" style="fill: none; stroke: var(--strong); stroke-width: 1;"></rect>';
  }
  function dots(x, y) { return box(x, y, 6, 6, 'strong') + box(x + 12, y, 6, 6, 'strong') + box(x + 24, y, 6, 6, 'strong'); }
  function listItem(key, i, text, check) {
    var mark = check
      ? '<rect x="-7" y="-7" width="14" height="14" style="fill: var(--ink);"></rect><path d="M-4 0 L-1 3 L4 -3" style="fill: none; stroke: var(--surface); stroke-width: 1.6; stroke-linecap: square;"></path>'
      : '<path d="M0 -6 L6 0 L0 6 L-6 0 Z" style="fill: var(--brand);"></path>';
    if (compact) return '<g data-k="' + key + i + '" opacity="0"><g transform="scale(1.8)">' + mark + '</g>' + label(26, 10, '0' + (i + 1) + ' ' + text, { color: 'ink', size: 13 }) + '</g>';
    return '<g data-k="' + key + i + '" opacity="0">' + mark + label(16, 5, '0' + (i + 1) + '  ' + text, { color: 'ink', size: 13 }) + '</g>';
  }

  function svgMarkup(F) {
    var form = '';
    for (var i = 0; i < 9; i++) form += outline(130, 240 + i * 16, 200, 10);

    // Deliverable chips, centred under the shipped screen.
    var widths = F.deliver.map(function (d) { return compact ? 62 + d.length * 17 : 44 + d.length * 8.4; });
    var gap = compact ? 16 : 12;
    var total = widths.reduce(function (a, b) { return a + b; }, 0) + gap * (widths.length - 1);
    var cx = 480 - total / 2;
    var chips = F.deliver.map(function (d, i) {
      var x = cx; cx += widths[i] + gap;
      var hh = compact ? 48 : 32;
      return '<g data-k="chip' + i + '" opacity="0" transform="translate(' + f2(x) + ' ' + chipY() + ')">' +
        '<rect x="0" y="0" width="' + f2(widths[i]) + '" height="' + hh + '" style="fill: var(--raised); stroke: var(--strong); stroke-width: 1;"></rect>' +
        '<path d="M12 16 L15.5 19.5 L22 12.5"' + (compact ? ' transform="translate(2 2) scale(1.5)"' : '') + ' style="fill: none; stroke: var(--brand); stroke-width: 1.8; stroke-linecap: square;"></path>' +
        label(compact ? 46 : 30, compact ? 34 : 21, d, { color: 'ink', size: 13, ls: '0.12em' }) + '</g>';
    }).join('');

    var files = [
      outline(12, 12, 30, 30) + '<path d="M27 19 L35 27 L27 35 L19 27 Z" style="fill: var(--brand);"></path>' + box(52, 16, 44, 4, 'ink') + box(52, 26, 30, 4, 'muted'),
      box(12, 12, 32, 5, 'brand') + box(50, 12, 46, 5, 'ink') + box(20, 24, 58, 5, 'muted') + box(20, 36, 40, 5, 'ink'),
      '<rect x="12" y="20" width="12" height="12" style="fill: none; stroke: var(--ink); stroke-width: 1.5;"></rect><path d="M24 26 H48 M62 26 H84" style="stroke: var(--strong); stroke-width: 1.5;"></path><path d="M55 19 L62 26 L55 33 L48 26 Z" style="fill: var(--brand);"></path><rect x="84" y="20" width="12" height="12" style="fill: none; stroke: var(--ink); stroke-width: 1.5;"></rect>'
    ].map(function (art, i) {
      return '<g data-k="file' + i + '" opacity="0" transform="translate(' + fileX(i) + ' 400)">' +
        '<rect x="0" y="0" width="' + (compact ? 156 : 110) + '" height="' + (compact ? 96 : 76) + '" style="fill: var(--raised); stroke: var(--strong); stroke-width: 1;"></rect>' + art +
        label(12, compact ? 84 : 64, F.files[i], { size: compact ? 10 : 12, ls: '0.04em' }) + '</g>';
    }).join('');

    var tokens = [0, 1, 2].map(function (i) {
      return '<g data-k="tk' + i + '" opacity="0">' +
        '<g data-k="tkR' + i + '"><path data-k="tkD' + i + '" d="' + DIAMOND + '" style="fill: var(--brand);"></path>' +
        '<path data-k="tkS' + i + '" d="' + DIAMOND + '" opacity="0" style="fill: var(--ink);"></path></g>' +
        '<path data-k="tkC' + i + '" d="M-5 0 L-1.5 3.5 L5 -3.5" opacity="0" style="fill: none; stroke: var(--surface); stroke-width: 2; stroke-linecap: square;"></path>' +
        '<g data-k="tkN' + i + '">' + label(0, compact ? -24 : -20, '0' + (i + 1), { anchor: 'middle', color: 'ink', size: 12 }) + '</g></g>';
    }).join('');

    var cmpX = compact ? 510 : 560;   // the comparison starts further left on phones so long lines fit
    return '<svg class="fm-film-svg' + (compact ? ' is-compact' : '') + '" viewBox="0 0 960 ' + (compact ? 760 : 540) + '" aria-hidden="true" focusable="false">' +
      '<defs><clipPath id="fm-film-clip"><rect x="110" y="108" width="460" height="352"></rect></clipPath></defs>' +

      /* ---- 01 audit ---- */
      '<rect data-k="s1bg" x="110" y="80" width="460" height="380" opacity="0" style="fill: var(--raised);"></rect>' +
      '<path data-k="s1frame" d="M110 80 H570 V460 H110 Z" pathLength="1" style="fill: none; stroke: var(--strong); stroke-width: 1.5; stroke-dasharray: 1 1; stroke-dashoffset: 1;"></path>' +
      '<g data-k="s1chrome" opacity="0"><path d="M110 108 H570" style="stroke: var(--strong); stroke-width: 1;"></path>' + dots(122, 91) + '</g>' +
      '<g data-k="s1content" opacity="0">' +
        box(130, 124, 56, 8, 'ink') + box(430, 126, 32, 4, 'muted') + box(474, 126, 32, 4, 'muted') + box(518, 126, 32, 4, 'muted') +
        box(130, 152, 250, 16, 'ink') + box(130, 176, 190, 16, 'ink') + box(130, 206, 250, 5, 'muted') + box(130, 218, 210, 5, 'muted') +
        box(410, 150, 140, 100, 'line') + label(480, 196, '4.2 s', { anchor: 'middle' }) + box(430, 210, 100, 3, 'surface') +
        '<rect data-k="s1load" x="430" y="210" width="0" height="3" style="fill: var(--brand);"></rect>' +
        form +
        '<path d="M110 396 H570" style="stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 4;"></path>' + label(562, 390, F.fold, { anchor: 'end', size: 11, ls: '0.12em' }) +
        box(130, 420, 84, 22, 'brand', ' opacity: 0.55;') +
      '</g>' +
      '<g clip-path="url(#fm-film-clip)"><g data-k="scan" opacity="0">' + box(110, -40, 460, 40, 'brand', ' opacity: 0.1;') + box(110, 0, 460, 1.5, 'brand') + '</g></g>' +
      '<g data-k="eye" opacity="0" transform="translate(770 150) scale(2)"><g data-k="eyeS">' +
        '<path data-k="eyeLid" d="M-28 0 Q0 -24 28 0 Q0 24 -28 0 Z" pathLength="1" style="fill: none; stroke: var(--ink); stroke-width: 1.25; stroke-linejoin: miter; stroke-miterlimit: 10; stroke-dasharray: 1 1; stroke-dashoffset: 1;"></path>' +
        '<g data-k="pupil"><path d="M0 -8 L8 0 L0 8 L-8 0 Z" style="fill: var(--brand);"></path></g></g></g>' +
      F.ann.map(function (a, i) { return listItem('ann', i, a, false); }).join('') +
      '<g data-k="card" opacity="0"><rect x="0" y="0" width="' + (compact ? 372 : 280) + '" height="' + (compact ? 128 : 96) + '" style="fill: var(--raised); stroke: var(--strong); stroke-width: 1;"></rect>' + box(0, 0, compact ? 372 : 280, 2, 'brand') +
        label(18, compact ? 40 : 30, F.cardLabel, { color: 'accent', size: compact ? 11 : 12, ls: '0.12em' }) +
        '<text x="18" y="' + (compact ? 100 : 72) + '" style="' + SANS + ' font-size: ' + (compact ? 36 : 28) + 'px; font-weight: 200; letter-spacing: -0.02em; fill: var(--ink);">' + esc(F.cardText) + '</text></g>' +

      /* ---- 02 sprint ---- */
      '<g data-k="day" opacity="0">' + label(60, 64, F.day, { size: 13, ls: '0.12em' }) +
        '<text data-k="dayN" x="56" y="134" style="' + SANS + ' font-size: 72px; font-weight: 200; letter-spacing: -0.04em; fill: var(--ink);">01</text></g>' +
      '<g data-k="cmp" opacity="0">' + label(cmpX, compact ? 50 : 58, F.agency, { size: compact ? 11 : 13, ls: '0.04em' }) + box(cmpX, compact ? 64 : 68, 340, 6, 'line') +
        '<rect data-k="cmpA" x="' + cmpX + '" y="' + (compact ? 64 : 68) + '" width="0" height="6" style="fill: var(--strong);"></rect>' +
        label(cmpX, compact ? 116 : 100, F.us, { color: 'accent', size: compact ? 11 : 13, ls: '0.04em' }) +
        '<rect data-k="cmpB" x="' + cmpX + '" y="' + (compact ? 130 : 110) + '" width="0" height="6" style="fill: var(--brand);"></rect></g>' +
      '<path data-k="loop" d="M300 180 H660 V360 H300 Z" pathLength="1" style="fill: none; stroke: var(--strong); stroke-width: 1.5; stroke-dasharray: 1 1; stroke-dashoffset: 1;"></path>' +
      '<g data-k="nodeP" opacity="0" transform="translate(300 270)"><rect data-k="nodePbox" x="-34" y="-34" width="68" height="68" style="fill: var(--raised); stroke: var(--ink); stroke-width: 1.5;"></rect>' +
        '<rect x="-7" y="-20" width="14" height="14" style="fill: none; stroke: var(--ink); stroke-width: 1.5;"></rect><path d="M-16 18 V6 H16 V18" style="fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linecap: square;"></path>' +
        label(0, compact ? 70 : 58, F.people, { anchor: 'middle', size: 13, ls: '0.12em' }) + '</g>' +
      '<g data-k="nodeA" opacity="0" transform="translate(660 270)"><rect data-k="nodeAbox" x="-34" y="-34" width="68" height="68" style="fill: var(--raised); stroke: var(--ink); stroke-width: 1.5;"></rect>' +
        '<path d="M-20 0 Q0 -17 20 0 Q0 17 -20 0 Z" style="fill: none; stroke: var(--ink); stroke-width: 1.5; stroke-linejoin: miter;"></path>' +
        '<g data-k="nodeApupil"><path d="M0 -6 L6 0 L0 6 L-6 0 Z" style="fill: var(--brand);"></path></g>' +
        label(0, compact ? 70 : 58, F.agents, { anchor: 'middle', size: 13, ls: '0.12em' }) + '</g>' +
      '<g data-k="pkt" opacity="0">' + box(-6, -6, 12, 12, 'brand') + '</g>' +
      files +

      /* ---- 03 ship ---- */
      '<rect data-k="finbg" x="250" y="70" width="460" height="360" opacity="0" style="fill: var(--raised);"></rect>' +
      '<path data-k="finframe" d="M250 70 H710 V430 H250 Z" pathLength="1" style="fill: none; stroke: var(--strong); stroke-width: 1.5; stroke-dasharray: 1 1; stroke-dashoffset: 1;"></path>' +
      '<g data-k="finchrome" opacity="0"><path d="M250 98 H710" style="stroke: var(--strong); stroke-width: 1;"></path>' + dots(262, 81) + '</g>' +
      '<g data-k="fincontent" opacity="0">' +
        box(270, 114, 56, 8, 'ink') + box(570, 116, 32, 4, 'muted') + box(614, 116, 32, 4, 'muted') + box(658, 116, 32, 4, 'muted') +
        box(270, 142, 270, 18, 'ink') + box(270, 166, 200, 18, 'ink') + box(270, 198, 250, 5, 'muted') + box(270, 210, 210, 5, 'muted') +
        box(270, 234, 110, 30, 'brand') +
        outline(270, 290, 220, 14) + outline(270, 312, 220, 14) + outline(270, 334, 220, 14) +
        box(560, 140, 130, 110, 'line') + label(625, 200, '0.9 s', { anchor: 'middle', color: 'ink' }) +
        '<path d="M270 400 H690" style="stroke: var(--line); stroke-width: 1;"></path>' +
      '</g>' +
      '<g data-k="ripple" opacity="0" transform="translate(325 249)"><rect x="-55" y="-15" width="110" height="30" style="fill: none; stroke: var(--brand); stroke-width: 2;"></rect></g>' +
      F.fix.map(function (a, i) { return listItem('fx', i, a, true); }).join('') +
      '<g data-k="live" opacity="0" transform="translate(610 52)"><g data-k="liveDot"><path d="M0 -6 L6 0 L0 6 L-6 0 Z" style="fill: var(--brand);"></path></g>' +
        label(14, 5, F.live, { color: 'accent', size: 13, ls: '0.12em' }) + '</g>' +
      chips +
      tokens +
      '<g data-k="cur" opacity="0"><path d="M0 0 L0 17 L4.5 13 L7.5 20 L10.5 18.8 L7.5 12 L13 12 Z" style="fill: var(--ink); stroke: var(--surface); stroke-width: 1.2; stroke-linejoin: miter;"></path></g>' +
      '</svg>';
  }

  function build() {
    compact = !!(MQ && MQ.matches);
    var T = tx(), F = T.film;
    var names = [T.m1, T.m2, T.m3];
    var chapters = names.map(function (n, i) {
      return '<button type="button" class="fm-film-ch" data-film="ch" data-i="' + i + '">' +
        '<span class="fm-film-ch-bar"><span data-k="pg' + i + '"></span></span>' +
        '<span class="fm-film-ch-label">0' + (i + 1) + ' ' + esc(n) + '</span></button>';
    }).join('');
    var script = names.map(function (n, i) {
      var lines = F.lines.filter(function (l) { return l[0] >= CH[i] && l[0] < (CH[i + 1] || DUR); });
      return '<li><span class="fm-film-script-h">0' + (i + 1) + ' ' + esc(n) + '</span>' +
        lines.map(function (l) { return '<span>' + esc(l[1]) + '</span>'; }).join('') + '</li>';
    }).join('');

    host.innerHTML =
      '<div class="fm-film-frame">' +
        '<div class="fm-film-stage">' + svgMarkup(F) +
          '<div class="fm-film-end" data-k="end" aria-hidden="true">' +
            '<svg width="96" height="96" viewBox="0 0 64 64" aria-hidden="true"><path class="fm-blink" d="M4 32 Q32 8 60 32 Q32 56 4 32 Z" style="fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: miter; stroke-miterlimit: 10;"></path><path d="M32 23 L41 32 L32 41 L23 32 Z" style="fill: var(--brand);"></path></svg>' +
            '<span class="fm-film-end-title">' + esc(F.endTitle) + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="fm-film-caption" data-k="cap"></p>' +
        '<div class="fm-film-actions" data-k="actions">' +
          '<button type="button" class="fm-btn fm-ck-btn fm-ck-primary" data-action="openContact" style="flex: none;">' + esc(T.cf.open) + ' ' + ICONS.arrow + '</button>' +
          '<a class="fm-btn fm-ck-btn" href="#book" style="flex: none;">' + esc(T.navBook) + '</a>' +
        '</div>' +
        '<div class="fm-film-bar">' +
          '<button type="button" class="fm-mode fm-film-play" data-film="play" data-k="play">' + ICONS.play + ICONS.pause + ICONS.replay + '</button>' +
          '<div class="fm-film-chapters">' + chapters + '</div>' +
          '<span class="fm-film-time" data-k="time" aria-hidden="true"></span>' +
        '</div>' +
      '</div>' +
      '<details class="fm-film-script"><summary>' + esc(F.script) + '</summary><ol>' + script + '</ol></details>';

    refs = {};
    Array.prototype.forEach.call(host.querySelectorAll('[data-k]'), function (el) { refs[el.getAttribute('data-k')] = el; });
    capIdx = -1;
    chapIdx = -1;
  }

  /* ---------- drawing helpers ---------- */
  var refs = {};
  function op(el, v) { el.setAttribute('opacity', f2(clamp(v))); }
  function tr(el, x, y, s, r) {
    el.setAttribute('transform', 'translate(' + f2(x) + ' ' + f2(y) + ')' + (s != null && s !== 1 ? ' scale(' + f2(s) + ')' : '') + (r ? ' rotate(' + f2(r) + ')' : ''));
  }
  function dash(el, p) { el.style.strokeDashoffset = f2(1 - clamp(p)); }
  function loopPt(d) {
    if (d < 360) return [300 + d, 180];
    if (d < 540) return [660, 180 + (d - 360)];
    if (d < 900) return [660 - (d - 540), 360];
    return [300, 360 - (d - 900)];
  }

  /* ---------- the scene at time t ---------- */
  function scene(t) {
    var r = refs, i;

    // 01 audit: one screen of the client's product, read by the eye.
    var s1out = 1 - ek(t, 7.8, 8.6);
    op(r.s1bg, ek(t, 0.2, 0.9) * s1out);
    dash(r.s1frame, ek(t, 0, 0.9)); op(r.s1frame, s1out);
    op(r.s1chrome, ek(t, 0.6, 1.1) * s1out);
    op(r.s1content, ek(t, 0.8, 1.6) * s1out); tr(r.s1content, 0, (1 - ek(t, 0.8, 1.6)) * 10);
    r.s1load.setAttribute('width', f2(100 * ((t % 1.6) / 1.6)));
    var sp = k(t, 2.2, 4.4);
    tr(r.scan, 0, lerp(108, 460, sp));
    op(r.scan, Math.min(k(t, 2.2, 2.4), 1 - k(t, 4.4, 4.6)));

    op(r.eye, win(t, 1.6, 2.2, 7.8, 8.4));
    dash(r.eyeLid, ek(t, 1.6, 2.4));
    var blink = (t > 6.6 && t < 6.9) ? 1 - Math.sin(k(t, 6.6, 6.9) * Math.PI) * 0.9 : 1;
    r.eyeS.setAttribute('transform', 'scale(1 ' + f2(blink) + ')');
    var gx = -5 * ek(t, 2.2, 2.6), gy = lerp(-5, 5, sp);
    if (t > 4.6) gy = lerp(5, 3, ek(t, 4.6, 5.6));
    if (t > 5.6) { gx = lerp(-5, 0, ek(t, 5.6, 6.2)); gy = lerp(3, 6, ek(t, 5.6, 6.2)); }
    tr(r.pupil, gx, gy, Math.max(0.01, ek(t, 2.0, 2.4)));

    for (i = 0; i < 3; i++) {
      var ai = ek(t, MK_T[i] + 0.2, MK_T[i] + 0.6);
      op(r['ann' + i], Math.min(ai, 1 - ek(t, 7.8, 8.4)));
      if (compact) tr(r['ann' + i], 130 + (1 - ai) * 14, 522 + i * 56);   // under the screen
      else tr(r['ann' + i], 640 + (1 - ai) * 14, 262 + i * 36);
    }
    op(r.card, win(t, 5.4, 6.2, 7.8, 8.4));
    tr(r.card, compact ? 578 : 640, (compact ? 240 : 372) + (1 - ek(t, 5.4, 6.2)) * 16);

    // 02 sprint: people and AI agents in one loop, tasks become files.
    var s2out = 1 - ek(t, 17.6, 18.4);
    op(r.day, ek(t, 9.4, 10.0) * s2out);
    r.dayN.textContent = '0' + (1 + Math.floor(4 * k(t, 10.2, 16.2)));
    op(r.cmp, win(t, 15.4, 15.9, 17.6, 18.2));
    r.cmpA.setAttribute('width', f2(340 * ek(t, 15.6, 16.4)));
    r.cmpB.setAttribute('width', f2(57 * ek(t, 16.2, 16.6)));
    dash(r.loop, ek(t, 9.4, 10.4)); op(r.loop, s2out);
    var nv = win(t, 9.8, 10.4, 17.6, 18.2), ns = lerp(0.85, 1, ek(t, 9.8, 10.4));
    op(r.nodeP, nv); tr(r.nodeP, 300, 270, ns);
    op(r.nodeA, nv); tr(r.nodeA, 660, 270, ns);
    var lapT = Math.max(0, t - 10.2) / 2.4;
    var d = (lapT % 1) * 1080;
    var pv = win(t, 10.2, 10.5, 17.2, 17.6);
    var pp = loopPt(d);
    op(r.pkt, pv); tr(r.pkt, pp[0], pp[1]);
    r.nodeAbox.style.stroke = (pv > 0.5 && Math.abs(d - 450) < 60) ? 'var(--brand)' : 'var(--ink)';
    r.nodePbox.style.stroke = (pv > 0.5 && (d > 930 && d < 1050)) ? 'var(--brand)' : 'var(--ink)';
    var turn = 90 * (Math.floor(lapT) + E(clamp(((lapT % 1) - 0.38) / 0.12)));
    r.nodeApupil.setAttribute('transform', 'rotate(' + f2(t > 10.2 ? turn : 0) + ')');
    for (i = 0; i < 3; i++) {
      var fa = ek(t, FILE_T[i], FILE_T[i] + 0.5), fo = ek(t, 17.6, 18.4);
      op(r['file' + i], Math.min(fa, 1 - fo));
      tr(r['file' + i], fileX(i), 400 + (1 - fa) * 12 - 120 * fo);
    }

    // 03 ship: the product, rebuilt with every fix, goes live.
    op(r.finbg, ek(t, 18.6, 19.2));
    dash(r.finframe, ek(t, 18.3, 19.2)); op(r.finframe, t >= 18.3 ? 1 : 0);
    op(r.finchrome, ek(t, 18.9, 19.3));
    op(r.fincontent, ek(t, 19.0, 19.8)); tr(r.fincontent, 0, (1 - ek(t, 19.0, 19.8)) * 10);
    for (i = 0; i < 3; i++) {
      var xi = ek(t, 19.8 + i * 0.4, 20.2 + i * 0.4);
      op(r['fx' + i], xi);
      if (compact) tr(r['fx' + i], 270 + (1 - xi) * 14, 486 + i * 54);   // under the shipped screen
      else tr(r['fx' + i], 728 + (1 - xi) * 14, 252 + i * 40);
    }
    var cp = ek(t, 20.9, 21.8);
    var press = (t > 21.9 && t < 22.2) ? 1 - 0.15 * Math.sin(k(t, 21.9, 22.2) * Math.PI) : 1;
    op(r.cur, win(t, 20.8, 21.1, 23.2, 23.6)); tr(r.cur, lerp(860, 330, cp), lerp(500, 254, cp), 1.6 * press);
    var rp = k(t, 22.0, 22.8);
    op(r.ripple, rp > 0 && rp < 1 ? 1 - rp : 0); tr(r.ripple, 325, 249, lerp(1, 1.4, E(rp)));
    op(r.live, ek(t, 22.4, 22.8));
    op(r.liveDot, 0.35 + 0.65 * Math.abs(Math.cos(t * 2.2)));
    for (i = 0; i < 3; i++) {
      var ci = ek(t, 22.8 + i * 0.3, 23.2 + i * 0.3);
      op(r['chip' + i], ci);
      var base = r['chip' + i].getAttribute('transform').match(/translate\(([-\d.]+)/);
      tr(r['chip' + i], base ? Number(base[1]) : 0, chipY() + (1 - ci) * 10);
    }

    // The three audit findings travel through the whole story.
    for (i = 0; i < 3; i++) {
      var o = ek(t, MK_T[i], MK_T[i] + 0.35);
      var p1 = ek(t, 8.0 + i * 0.15, 9.2 + i * 0.15);
      var p2 = ek(t, 17.8 + i * 0.15, 18.9 + i * 0.15);
      var x = lerp(lerp(MK[i][0], Q[i][0], p1), BD[i][0], p2);
      var y = lerp(lerp(MK[i][1], Q[i][1], p1), BD[i][1], p2);
      op(r['tk' + i], o);
      tr(r['tk' + i], x, y, lerp(0.4, 1, o) * lerp(1, 0.85, p2));
      var dn = ek(t, DONE_T[i], DONE_T[i] + 0.4);
      r['tkR' + i].setAttribute('transform', 'rotate(' + f2(45 * dn) + ')');
      op(r['tkD' + i], 1 - dn); op(r['tkS' + i], dn);
      op(r['tkC' + i], ek(t, DONE_T[i] + 0.3, DONE_T[i] + 0.5));
      op(r['tkN' + i], 1 - p2);
    }

    // End card.
    var e = ek(t, END_AT, END_AT + 0.6);
    r.end.style.opacity = f2(e);
    r.end.style.visibility = e > 0 ? 'visible' : 'hidden';

    // Caption.
    var lines = tx().film.lines, idx = 0;
    for (i = 0; i < lines.length; i++) if (lines[i][0] <= t) idx = i;
    if (idx !== capIdx) {
      capIdx = idx;
      r.cap.classList.remove('is-in');
      r.cap.textContent = lines[idx][1];
      void r.cap.offsetWidth;
      r.cap.classList.add('is-in');
    }
  }

  /* ---------- controls ---------- */
  var capIdx = -1, chapIdx = -1;
  function mmss(s) { s = Math.floor(s); return '00:' + (s < 10 ? '0' : '') + s; }
  function ui() {
    var T = tx(), F = T.film, names = [T.m1, T.m2, T.m3];
    var ch = t >= CH[2] ? 2 : t >= CH[1] ? 1 : 0;
    for (var i = 0; i < 3; i++) refs['pg' + i].style.width = f2(k(t, CH[i], CH[i] + 9) * 100) + '%';
    if (ch !== chapIdx) {
      chapIdx = ch;
      if (refs.chap) refs.chap.textContent = '0' + (ch + 1) + ' / ' + names[ch];
      Array.prototype.forEach.call(host.querySelectorAll('.fm-film-ch'), function (b, j) {
        b.classList.toggle('is-on', j === ch);
        if (j === ch) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    // The Method steps beside the film act as its chapter menu.
    var steps = document.querySelector('.fm-method-steps');
    if (steps) {
      steps.classList.toggle('is-live', started);
      Array.prototype.forEach.call(steps.querySelectorAll('[data-method-step]'), function (el, j) {
        var box = el.closest('.fm-step') || el;
        box.style.setProperty('--p', started ? f2(k(t, CH[j], CH[j] + 9)) : 0);
        box.classList.toggle('is-on', started && j === ch);
        box.classList.toggle('is-done', started && j < ch);
        el.setAttribute('aria-expanded', String(started ? j === ch : j === 0));
        if (started && j === ch) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
      });
    }
    refs.time.textContent = mmss(t) + ' / ' + mmss(DUR);
    var ended = t >= DUR;
    var stateName = playing ? 'playing' : ended ? 'ended' : 'paused';
    refs.play.setAttribute('data-state', stateName);
    refs.play.setAttribute('aria-label', playing ? F.pause : ended ? F.replay : F.play);
    var showActions = t >= END_AT;
    refs.actions.classList.toggle('is-on', showActions);
    Array.prototype.forEach.call(refs.actions.querySelectorAll('a, button'), function (el) {
      if (showActions) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '-1');
    });
    refs.actions.setAttribute('aria-hidden', String(!showActions));
  }

  /* ---------- playback ---------- */
  var t = 0, shown = POSTER, playing = false, started = false, raf = 0, last = 0;
  var visible = false, userPaused = false;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var globalPaused = root ? !root.classList.contains('fm-motion') : false;

  function draw() { scene(shown); ui(); }
  function frame(now) {
    if (!playing) return;
    t = Math.min(DUR, t + Math.min(0.1, (now - last) / 1000));
    last = now;
    shown = t;
    if (t >= DUR) { playing = false; draw(); return; }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (playing) return;
    if (t >= DUR || !started) t = started && t < DUR ? t : 0;
    started = true;
    playing = true;
    shown = t;
    last = performance.now();
    draw();
    raf = requestAnimationFrame(frame);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    ui();
  }
  function seek(s) { t = s; shown = s; started = true; draw(); }
  function maybeAutoplay() {
    if (visible && !userPaused && !globalPaused && !reduced && t < DUR) play();
  }

  host.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-film]');
    if (!el) return;
    var what = el.getAttribute('data-film');
    if (what === 'play') {
      if (playing) { userPaused = true; pause(); }
      else { userPaused = false; if (t >= DUR) seek(0); play(); }
    } else if (what === 'ch') {
      userPaused = false;
      pause();
      seek(CH[Number(el.getAttribute('data-i'))]);
      play();
    }
  });

  // Clicking or pressing Enter/Space on a Method step plays that chapter.
  function playStep(el) {
    userPaused = false;
    pause();
    seek(CH[Number(el.getAttribute('data-method-step'))]);
    play();
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-method-step]');
    if (el) playStep(el);
  });
  document.addEventListener('keydown', function (ev) {
    var el = ev.target;
    if (el && el.hasAttribute && el.hasAttribute('data-method-step') && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); playStep(el); }
  });

  document.addEventListener('fm:lang', function () { build(); draw(); });
  if (MQ) { var onMQ = function () { build(); draw(); }; if (MQ.addEventListener) MQ.addEventListener('change', onMQ); else if (MQ.addListener) MQ.addListener(onMQ); }
  document.addEventListener('fm:motion', function (ev) {
    globalPaused = !!(ev.detail && ev.detail.paused);
    if (globalPaused) pause(); else maybeAutoplay();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) pause();
    else if (!document.hidden) maybeAutoplay();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible = en.isIntersecting && en.intersectionRatio >= 0.45;
        if (visible) maybeAutoplay(); else if (playing) pause();
      });
    }, { threshold: [0, 0.45, 0.7] }).observe(host);
  }

  // Jump to a moment and hold it (used for checks and stills): FM_FILM.seek(seconds).
  window.FM_FILM = { seek: function (s) { userPaused = true; pause(); seek(s); } };

  build();
  draw();
})();
