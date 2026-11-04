/* formai — hero grid motion.
 * Now and then one square of the hero background grid turns into a diamond,
 * rolls one cell in a random direction and lands as a square again.
 * Runs only while the hero is on screen and animations are allowed.
 */
(function () {
  'use strict';
  var fx = document.querySelector('.fm-hero-fx');
  var root = document.getElementById('top');
  if (!fx || !root || !fx.animate) return;

  var CELL = 48;          // must match background-size of .fm-hero::before
  var MAX = 3;            // squares moving at the same time
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var visible = true, timer = 0, live = 0;

  function allowed() {
    return visible && !document.hidden && root.classList.contains('fm-motion') && !(reduced && reduced.matches);
  }

  // The grid is centred, so its lines sit at (size - CELL) / 2 + k * CELL.
  function origin(size) { var o = ((size - CELL) / 2) % CELL; return o < 0 ? o + CELL : o; }

  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function spawn() {
    var W = fx.clientWidth, H = fx.clientHeight;
    if (!W || !H || live >= MAX) return;
    var ox = origin(W), oy = origin(H);
    var cols = Math.floor((W - ox) / CELL), rows = Math.floor((H - oy) / CELL);
    if (cols < 4 || rows < 4) return;
    // Stay inside the clearly visible middle of the mask.
    var c = Math.floor(cols * 0.2) + Math.floor(Math.random() * Math.max(1, cols * 0.6));
    var r = 1 + Math.floor(Math.random() * Math.max(1, rows - 3));
    var d = DIRS[Math.floor(Math.random() * 4)];
    var dx = d[0] * CELL, dy = d[1] * CELL;
    var turn = (d[0] || d[1]) > 0 ? 1 : -1;   // roll the way it travels

    var el = document.createElement('span');
    el.className = 'fm-hx-cell';
    el.style.left = (ox + c * CELL) + 'px';
    el.style.top = (oy + r * CELL) + 'px';
    fx.appendChild(el);
    live++;

    var a = el.animate([
      { opacity: 0, transform: 'translate(0,0) rotate(0deg) scale(1)' },
      { opacity: 1, transform: 'translate(0,0) rotate(0deg) scale(1)', offset: 0.14 },
      { opacity: 1, transform: 'translate(0,0) rotate(' + 45 * turn + 'deg) scale(.7)', offset: 0.34 },
      { opacity: 1, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + 135 * turn + 'deg) scale(.7)', offset: 0.64 },
      { opacity: 1, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + 180 * turn + 'deg) scale(1)', offset: 0.82 },
      { opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + 180 * turn + 'deg) scale(1)' }
    ], { duration: 3400, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'both' });
    var done = function () { live--; if (el.parentNode) el.parentNode.removeChild(el); };
    a.onfinish = done; a.oncancel = done;
  }

  function loop() {
    clearTimeout(timer);
    if (allowed()) spawn();
    timer = setTimeout(loop, 900 + Math.random() * 1100);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(fx.parentNode);
  }
  document.addEventListener('fm:motion', function (ev) {
    if (ev.detail && ev.detail.paused) fx.getAnimations && fx.querySelectorAll('.fm-hx-cell').forEach(function (n) { n.getAnimations().forEach(function (an) { an.cancel(); }); });
  });
  timer = setTimeout(loop, 1600);
})();
