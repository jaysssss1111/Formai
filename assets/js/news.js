/* formai — AI news cards for the news carousel.
 * Shared by the browser (main.js) and the build step (tools/prerender.mjs),
 * so the same layout is in the published HTML and on screen: the newest
 * article as the lead story, the next ones as a list beside it, topic
 * filters and a freshness line. An article's optional "take" ({ en, fi }) is
 * one line on what it means for a business, written by hand in news.json.
 * Articles live in assets/data/news.json. A card shows the publisher's own
 * preview image (og:image) when there is one; underneath, a cover is drawn in
 * the brand style from the article's topic, which also shows if the image fails.
 */
(function (root) {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function r(x, y, w, h, fill, stroke, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" style="fill: ' + (fill ? 'var(--' + fill + ')' : 'none') +
      ';' + (stroke ? ' stroke: var(--' + stroke + '); stroke-width: 1;' : '') + (extra || '') + '"></rect>';
  }
  function d(cx, cy, s) {
    return '<path d="M' + cx + ' ' + (cy - s) + ' L' + (cx + s) + ' ' + cy + ' L' + cx + ' ' + (cy + s) + ' L' + (cx - s) + ' ' + cy + ' Z" style="fill: var(--brand);"></path>';
  }

  // One cover per topic; the index shifts the accent so neighbours differ.
  var COVERS = {
    design: function (k) {
      return '<circle cx="200" cy="110" r="70" style="fill: none; stroke: var(--strong); stroke-width: 1;"></circle>' +
        '<path d="M90 110 H310 M200 30 V190" style="stroke: var(--line); stroke-width: 1;"></path>' +
        '<path d="M130 110 Q200 56 270 110 Q200 164 130 110 Z" style="fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: miter;"></path>' +
        d(200, 110, 16) + d(110 + k * 60, 40, 5);
    },
    code: function (k) {
      var rows = '';
      for (var i = 0; i < 7; i++) rows += r(70 + (i % 3) * 16, 52 + i * 18, 60 + ((i * 37 + k * 23) % 140), 8, i % 3 === k % 3 ? 'brand' : (i % 2 ? 'muted' : 'ink'));
      return r(50, 30, 300, 164, 'raised', 'strong') + '<path d="M50 44 H350" style="stroke: var(--line);"></path>' + rows +
        '<rect x="' + (140 + k * 20) + '' + '" y="160" width="2" height="12" style="fill: var(--brand);"></rect>';
    },
    agents: function (k) {
      return '<path d="M90 70 H190 M210 90 V140 M230 160 H310" style="fill: none; stroke: var(--strong); stroke-width: 1.5;"></path>' +
        r(60, 50, 40, 40, 'raised', 'ink') + r(180, 50, 40, 40, 'raised', 'ink') + r(180, 140, 40, 40, 'raised', 'ink') + r(310, 140, 40, 40, 'raised', 'ink') +
        '<path d="M200 60 L210 70 L200 80 L190 70 Z" style="fill: none; stroke: var(--ink); stroke-width: 1.5;"></path>' +
        d([140, 210, 270][k % 3], [70, 115, 160][k % 3], 7);
    },
    regulation: function (k) {
      return r(120, 24, 160, 176, 'raised', 'strong') + r(140, 48, 90, 8, 'ink') +
        r(140, 70, 120, 5, 'muted') + r(140, 82, 110, 5, 'muted') + r(140, 94, 120, 5, 'muted') + r(140, 112, 100, 5, 'muted') + r(140, 124, 116, 5, 'muted') +
        '<text x="142" y="172" style="font-family: \'DM Mono\', ui-monospace, monospace; font-size: 22px; fill: var(--ink);">§</text>' +
        '<g transform="translate(' + (242 + k * 4) + ' 162) rotate(45)"><rect x="-17" y="-17" width="34" height="34" style="fill: none; stroke: var(--brand); stroke-width: 2;"></rect></g>' + d(242 + k * 4, 162, 7);
    },
    search: function (k) {
      return r(70, 40, 260, 30, 'raised', 'strong') +
        '<path d="M86 55 Q96 47 106 55 Q96 63 86 55 Z" style="fill: none; stroke: var(--ink); stroke-width: 1.2;"></path>' + r(118, 52, 120, 6, 'muted') +
        r(70, 90, 260, 30, 'raised', 'line') + r(70, 128, 260, 30, 'raised', 'line') + r(70, 166, 260, 30, 'raised', 'line') +
        r(84, 101 + (k % 3) * 38, 150, 8, 'ink') + d(312, 105 + (k % 3) * 38, 6);
    }
  };

  function cover(topic, k) {
    var art = (COVERS[topic] || COVERS.agents)(k % 3);
    return '<svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + art + '</svg>';
  }

  function formatDate(iso, lang) {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(lang === 'fi' ? 'fi-FI' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
    } catch (e) { return iso; }
  }

  function take(item, tr, lang) {
    var v = item.take && (item.take[lang] || item.take.en);
    return v ? '<p class="fm-news-take"><span>' + esc(tr.newsTake) + '</span>' + esc(v) + '</p>' : '';
  }
  // Topic -> the service that answers it (index in the Services picker), or a FAQ answer.
  var HELP = { design: 0, code: 3, agents: 4, search: 5, regulation: 'faq-data' };
  var DAY = 86400000;
  function isNew(item) {
    var d = Date.parse((item.date || '') + 'T00:00:00Z');
    return d && Date.now() - d < 7 * DAY;
  }
  function actions(item, tr) {
    var h = HELP[item.topic], help = '';
    var ARR = '<svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7 H12 M8 3 L12 7 L8 11" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>';
    if (typeof h === 'number') {
      help = '<button type="button" class="fm-news-help" data-action="heroService" data-i="' + h + '"><span>' + esc(tr.newsHelp) + '</span> ' + esc(tr['s' + (h + 1)]) + ' ' + ARR + '</button>';
    } else if (h) {
      help = '<a class="fm-news-help" href="#' + h + '"><span>' + esc(tr.newsHelp) + '</span> ' + esc(tr.newsHelpData) + ' ' + ARR + '</a>';
    }
    var share = '<button type="button" class="fm-news-share" data-news-share="' + esc(item.url) + '">' +
      '<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1 V9 M3.5 4.5 L7 1 L10.5 4.5 M2 8 V13 H12 V8" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg>' +
      '<span>' + esc(tr.newsShare) + '</span></button>';
    return '<div class="fm-news-actions">' + help + share + '</div>';
  }
  function image(item, i) {
    return cover(item.topic, i) +
      (item.image ? '<img src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : '');
  }
  function metaLine(item, tr, lang) {
    var topic = (tr.newsTopics && tr.newsTopics[item.topic]) || '';
    return '<div class="fm-news-meta">' + (isNew(item) ? '<span class="fm-news-new">' + esc(tr.newsNew) + '</span>' : '') +
      (topic ? '<span class="fm-news-topic">' + esc(topic) + '</span>' : '') +
      '<span>' + esc(item.source) + (item.date ? ' · ' + esc(formatDate(item.date, lang)) : '') + '</span></div>';
  }
  // A compact row for the list beside the lead story.
  function row(item, i, tr, lang) {
    return '<article class="fm-news-row" role="listitem">' +
      '<a class="fm-news-rowlink" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<div class="fm-news-thumb">' + image(item, i) + '</div>' +
      '<div class="fm-news-rowbody">' + metaLine(item, tr, lang) +
      '<h3 class="fm-news-rowtitle">' + esc(item.title) + '</h3>' + take(item, tr, lang) + '</div></a>' + actions(item, tr) + '</article>';
  }
  function sorted(items) {
    return (items || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }
  // opts: { topic: '' | 'design' | ..., all: bool }. Shows the lead and 4 more unless all.
  function layout(items, tr, lang, opts) {
    opts = opts || {};
    var list = sorted(items).filter(function (x) { return !opts.topic || x.topic === opts.topic; });
    if (!list.length) return '';
    var SHOW = 4, rest = list.slice(1), shown = opts.all ? rest : rest.slice(0, SHOW);
    var more = rest.length > SHOW
      ? '<button type="button" class="fm-news-more" data-news-more aria-expanded="' + !!opts.all + '">' +
        esc(opts.all ? tr.newsLess : tr.newsMore.replace('{n}', list.length)) + '</button>' : '';
    return '<div class="fm-news-lead" role="list">' + card(list[0], 0, tr, lang, true) + '</div>' +
      '<div class="fm-news-side"><div class="fm-news-list" role="list">' + shown.map(function (x, k) { return row(x, k + 1, tr, lang); }).join('') + '</div>' + more + '</div>';
  }
  function filters(items, tr, active) {
    var have = {};
    (items || []).forEach(function (x) { have[x.topic] = (have[x.topic] || 0) + 1; });
    var keys = Object.keys(tr.newsTopics || {}).filter(function (k) { return have[k]; });
    if (keys.length < 2) return '';
    var chip = function (k, label) {
      var on = (active || '') === k;
      return '<button type="button" class="fm-news-chip' + (on ? ' is-on' : '') + '" data-news-topic="' + k + '" aria-pressed="' + on + '">' + esc(label) + '</button>';
    };
    return chip('', tr.newsAll) + keys.map(function (k) { return chip(k, tr.newsTopics[k]); }).join('');
  }
  function stamp(items, tr, lang) {
    var list = sorted(items);
    if (!list.length || !tr.newsStamp) return '';
    var fresh = list.filter(isNew).length;
    return tr.newsStamp.replace('{d}', formatDate(list[0].date, lang)).replace('{n}', list.length) +
      (fresh && tr.newsStampNew ? tr.newsStampNew.replace('{k}', fresh) : '');
  }

  // tr: the language's copy (needs newsRead and newsTopics); lang: 'en' or 'fi'.
  function card(item, i, tr, lang, lead) {
    var topic = (tr.newsTopics && tr.newsTopics[item.topic]) || '';
    var meta = esc(item.source) + (item.date ? ' · ' + esc(formatDate(item.date, lang)) : '');
    return '<article class="fm-news-card' + (lead ? ' is-lead' : '') + '" role="listitem">' +
      '<a class="fm-news-link" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' +
      // The publisher's preview image over the drawn cover; if it fails, the cover shows.
      '<div class="fm-news-cover">' + cover(item.topic, i) +
      (item.image ? '<img src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
      '</div>' +
      '<div class="fm-news-body">' +
      '<div class="fm-news-meta">' + (isNew(item) ? '<span class="fm-news-new">' + esc(tr.newsNew) + '</span>' : '') + (topic ? '<span class="fm-news-topic">' + esc(topic) + '</span>' : '') + '<span>' + meta + '</span></div>' +
      '<h3 class="fm-news-title">' + esc(item.title) + '</h3>' +
      (item.summary ? '<p class="fm-news-summary">' + esc(item.summary) + '</p>' : '') + take(item, tr, lang) +
      '<span class="fm-news-read">' + esc(tr.newsRead) + ' ' + esc(item.source) +
      ' <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 L9 3 M4 3 H9 V8" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg></span>' +
      '</div></a>' + actions(item, tr) + '</article>';
  }

  function cards(items, tr, lang) {
    return (items || []).map(function (it, i) { return card(it, i, tr, lang); }).join('');
  }

  root.FM_NEWS_UI = { cards: cards, layout: layout, filters: filters, stamp: stamp };
})(typeof window !== 'undefined' ? window : this);
