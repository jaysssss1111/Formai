/* formai — background grid motion.
 * Layers marked data-grid-fx sit over a 48px background grid and animate
 * single cells, aligned to the grid lines:
 *   roll   (hero)     a square turns into a diamond, rolls one cell, lands square
 *   ripple (services) a cell pings and the signal spreads to its neighbours
 * Runs only while the layer is on screen and animations are allowed.
 */
(function () {
  'use strict';
  var root = document.getElementById('top');
  var layers = document.querySelectorAll('[data-grid-fx]');
  if (!root || !layers.length || !document.body.animate) return;

  var CELL = 48;   // must match background-size of the grid
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // The grid is centred, so its lines sit at (size - CELL) / 2 + k * CELL.
  function origin(size) { var o = ((size - CELL) / 2) % CELL; return o < 0 ? o + CELL : o; }

  function cell(fx, x, y, ring) {
    var el = document.createElement('span');
    el.className = 'fm-hx-cell' + (ring ? ' is-ring' : '');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    fx.appendChild(el);
    return el;
  }
  function cleanup(layer, el, a) {
    var done = function () { if (el.parentNode) el.parentNode.removeChild(el); };
    a.onfinish = done; a.oncancel = done;
  }
  // Pick a cell inside the clearly visible middle of the mask.
  function pick(fx, marginRows, side) {
    side = side == null ? 0.22 : side;
    var W = fx.clientWidth, H = fx.clientHeight;
    if (!W || !H) return null;
    var ox = origin(W), oy = origin(H);
    var cols = Math.floor((W - ox) / CELL), rows = Math.floor((H - oy) / CELL);
    if (cols < 6 || rows < 2 * marginRows + 2) return null;
    return {
      ox: ox, oy: oy,
      c: Math.floor(cols * side) + Math.floor(Math.random() * Math.max(1, cols * (1 - 2 * side))),
      r: marginRows + Math.floor(Math.random() * Math.max(1, rows - 2 * marginRows))
    };
  }

  // Rectangles of content that would hide a cell (data-grid-avoid selector).
  function blockers(fx) {
    var sel = fx.getAttribute('data-grid-avoid');
    return sel ? Array.prototype.map.call(fx.parentNode.querySelectorAll(sel), function (c) { return c.getBoundingClientRect(); }) : [];
  }
  // strict: the whole cell must stay clear; loose: only the cell centre (lets cells sit in narrow gutters).
  function hiddenAt(fx, rects, p, dc, dr, loose) {
    var base = fx.getBoundingClientRect();
    var x = base.left + p.ox + (p.c + dc + 0.5) * CELL, y = base.top + p.oy + (p.r + dr + 0.5) * CELL;
    var h = loose ? -CELL : CELL / 2;
    return rects.some(function (r) { return x + h > r.left && x - h < r.right && y + h > r.top && y - h < r.bottom; });
  }

  var MODES = {
    roll: { every: [900, 2000], max: 3, run: function (layer) {
      var p = pick(layer.fx, 1); if (!p) return;
      var d = DIRS[Math.floor(Math.random() * 4)], dx = d[0] * CELL, dy = d[1] * CELL;
      var turn = (d[0] || d[1]) > 0 ? 1 : -1;
      var el = cell(layer.fx, p.ox + p.c * CELL, p.oy + p.r * CELL, false);
      layer.live++;
      var a = el.animate([
        { opacity: 0, transform: 'translate(0,0) rotate(0deg) scale(1)' },
        { opacity: 1, transform: 'translate(0,0) rotate(0deg) scale(1)', offset: 0.14 },
        { opacity: 1, transform: 'translate(0,0) rotate(' + 45 * turn + 'deg) scale(.7)', offset: 0.34 },
        { opacity: 1, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + 135 * turn + 'deg) scale(.7)', offset: 0.64 },
        { opacity: 1, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + 180 * turn + 'deg) scale(1)', offset: 0.82 },
        { opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + 180 * turn + 'deg) scale(1)' }
      ], { duration: 3400, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' });
      a.addEventListener('finish', function () { layer.live--; });
      a.addEventListener('cancel', function () { layer.live--; });
      cleanup(layer, el, a);
    } },
    ripple: { every: [1200, 2200], max: 2, run: function (layer) {
      // Prefer spots that are not hidden behind content, so the ripple can be seen.
      var p = null, rects = blockers(layer.fx);
      for (var t = 0; t < 12 && !p; t++) {
        var q = pick(layer.fx, 2, 0.1); if (!q) return;
        if (!hiddenAt(layer.fx, rects, q, 0, 0, true)) p = q;
      }
      if (!p) return;
      layer.live++;
      var left = 0;
      // Centre, then the four neighbours, then the next ring (diamond-shaped spread).
      for (var ring = 0; ring <= 2; ring++) {
        for (var i = -ring; i <= ring; i++) {
          var j = ring - Math.abs(i);
          var spots = j === 0 ? [[i, 0]] : [[i, j], [i, -j]];
          spots.forEach(function (s) {
            var el = cell(layer.fx, p.ox + (p.c + s[0]) * CELL, p.oy + (p.r + s[1]) * CELL, ring > 0);
            var peak = ring === 0 ? 1 : ring === 1 ? 0.6 : 0.3;
            left++;
            var a = el.animate([
              { opacity: 0, transform: 'scale(.86)' },
              { opacity: peak, transform: 'scale(1)', offset: 0.3 },
              { opacity: 0, transform: 'scale(1)' }
            ], { duration: 1500, delay: ring * 180, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
            var end = function () { if (--left === 0) layer.live--; };
            a.addEventListener('finish', end); a.addEventListener('cancel', end);
            cleanup(layer, el, a);
          });
        }
      }
    } },
    // Booking: a row of time slots lights up one after another, the last one gets booked.
    slots: { every: [1600, 2800], max: 2, run: function (layer) {
      var rects = blockers(layer.fx), p = null, len = 4 + Math.floor(Math.random() * 3);
      for (var t = 0; t < 16 && !p; t++) {
        var q = pick(layer.fx, 2, 0.08); if (!q) return;
        var ok = true;
        for (var k = 0; k < len && ok; k++) if (hiddenAt(layer.fx, rects, q, k, 0)) ok = false;
        if (ok) p = q;
      }
      if (!p) return;
      layer.live++;
      var left = len, STEP = 200, HOLD = 1300;
      for (var k = 0; k < len; k++) {
        var last = k === len - 1;
        var el = cell(layer.fx, p.ox + (p.c + k) * CELL, p.oy + p.r * CELL, !last);
        if (last) el.classList.add('is-booked');
        var total = (len - 1 - k) * STEP + HOLD + 600;
        var a = el.animate([
          { opacity: 0, transform: 'scaleX(.2)' },
          { opacity: last ? 1 : 0.55, transform: 'scaleX(1)', offset: 220 / total },
          { opacity: last ? 1 : 0.55, transform: 'scaleX(1)', offset: (total - 600) / total },
          { opacity: 0, transform: 'scaleX(1)' }
        ], { duration: total, delay: k * STEP, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
        var end = function () { if (--left === 0) layer.live--; };
        a.addEventListener('finish', end); a.addEventListener('cancel', end);
        cleanup(layer, el, a);
      }
    } }
  };

  function allowed(layer) {
    return layer.visible && !document.hidden && root.classList.contains('fm-motion') && !(reduced && reduced.matches);
  }

  Array.prototype.forEach.call(layers, function (fx) {
    var mode = MODES[fx.getAttribute('data-grid-fx')];
    if (!mode) return;
    var layer = { fx: fx, visible: true, live: 0 };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { layer.visible = e[0].isIntersecting; }).observe(fx.parentNode);
    }
    (function loop() {
      if (allowed(layer) && layer.live < mode.max) mode.run(layer);
      setTimeout(loop, mode.every[0] + Math.random() * (mode.every[1] - mode.every[0]));
    })();
  });

  document.addEventListener('fm:motion', function (ev) {
    if (!(ev.detail && ev.detail.paused)) return;
    Array.prototype.forEach.call(document.querySelectorAll('.fm-hx-cell'), function (n) {
      n.getAnimations().forEach(function (an) { an.cancel(); });
    });
  });
})();
