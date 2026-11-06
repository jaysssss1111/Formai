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

  function monthName(ym, lang) {
    if (!/^\d{4}-\d{2}$/.test(ym || '')) return '';
    try {
      var s = new Intl.DateTimeFormat(lang === 'fi' ? 'fi-FI' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ym + '-01T00:00:00Z'));
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (e) { return ym; }
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
    var read = '<a class="fm-news-readbtn" href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' +
      esc((tr.newsReadBtn || 'Read') + ': ' + item.title + ' (' + item.source + ')') + '"><span>' + esc(tr.newsReadBtn || 'Read') + '</span>' +
      '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 9 L9 3 M4 3 H9 V8" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg></a>';
    var like = '<button type="button" class="fm-news-like" data-news-like="' + esc(item.url) + '" aria-pressed="false" aria-label="' +
      esc((tr.newsLike || 'Like') + ': ' + item.title) + '" title="' + esc(tr.newsLike || 'Like') + '">' +
      '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14 L2.2 8.3 A3.3 3.3 0 0 1 8 3.6 A3.3 3.3 0 0 1 13.8 8.3 Z" style="stroke: currentColor; stroke-width: 1.5; stroke-linejoin: round;"></path></svg></button>';
    return '<div class="fm-news-actions">' + help + '<div class="fm-news-btns">' + like + share + read + '</div></div>';
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
      '<div class="fm-news-rowlink">' +
      '<div class="fm-news-thumb">' + image(item, i) + '</div>' +
      '<div class="fm-news-rowbody">' + metaLine(item, tr, lang) +
      '<h3 class="fm-news-rowtitle"><button type="button" class="fm-news-pick" data-news-pick="' + esc(item.url) + '" aria-controls="fm-news-lead">' + esc(item.title) + '</button></h3>' +
      take(item, tr, lang) + '</div></div></article>';
  }
  function sorted(items) {
    return (items || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }
  // opts: { topic: '' | 'design' | ..., all: bool, pick: url }. Shows the lead (the picked article, else
  // the newest) and 4 more unless all.
  function layout(items, tr, lang, opts) {
    opts = opts || {};
    var list = sorted(items).filter(function (x) { return !opts.topic || x.topic === opts.topic; });
    if (!list.length) return '';
    var lead = 0;
    if (opts.pick) list.forEach(function (x, k) { if (x.url === opts.pick) lead = k; });
    var top = list[lead], rest = list.filter(function (x, k) { return k !== lead; });
    // The lead and four more beside it; everything older (the rest of news.json and the
    // archive) opens under "More articles", grouped by month, newest first.
    var SHOW = 4, shown = rest.slice(0, SHOW), older = rest.slice(SHOW);
    var btn = function (where) { return moreBtn(older.length, tr, opts, where); };
    var more = '';
    var olderHtml = '';
    if (opts.all && older.length) {
      var groups = [], cur = null;
      older.forEach(function (x, k) {
        var m = String(x.date || '').slice(0, 7);
        if (!cur || cur.m !== m) { cur = { m: m, items: [] }; groups.push(cur); }
        cur.items.push(row(x, SHOW + 1 + k, tr, lang));
      });
      olderHtml = '<div class="fm-news-older" id="fm-news-older"><h3 class="fm-news-older-h">' + esc(tr.newsOlder) + '</h3>' +
        groups.map(function (g) {
          return '<section class="fm-news-month" aria-label="' + esc(monthName(g.m, lang)) + '"><h4>' + esc(monthName(g.m, lang)) + '</h4>' +
            '<div class="fm-news-list" role="list">' + g.items.join('') + '</div></section>';
        }).join('') + btn('end') + '</div>';
    }
    return '<div class="fm-news-lead" id="fm-news-lead" role="list" aria-live="polite">' + card(top, lead, tr, lang, true) + '</div>' +
      '<div class="fm-news-side"><div class="fm-news-list" role="list">' + shown.map(function (x, k) { return row(x, k + 1, tr, lang); }).join('') + '</div>' + more + '</div>' + olderHtml;
  }
  // How many articles sit beyond the lead and the four beside it, for the same topic and pick.
  function olderCount(items, opts) {
    opts = opts || {};
    var list = (items || []).filter(function (x) { return !opts.topic || x.topic === opts.topic; });
    return Math.max(0, list.length - 5);
  }
  function moreBtn(count, tr, opts, where) {
    if (!count) return '';
    return '<button type="button" class="fm-news-more' + (where === 'chip' ? ' is-chip' : '') + '" data-news-more="' + where + '" aria-expanded="' + !!opts.all + '" aria-controls="fm-news-older">' +
      '<svg class="fm-news-more-ic" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3.5 H6 L7.5 5 H14.5 V13 H1.5 Z" style="fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: miter;"></path><path d="M1.5 7 H14.5" style="fill: none; stroke: currentColor; stroke-width: 1.4;"></path></svg>' +
      '<span>' + esc(opts.all ? tr.newsLess : tr.newsMore.replace('{n}', count)) + '</span>' +
      '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="' + (opts.all ? 'M2 8 L6 4 L10 8' : 'M2 4 L6 8 L10 4') + '" style="fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square;"></path></svg></button>';
  }
  function moreButton(items, tr, opts, where) { return moreBtn(olderCount(items, opts), tr, opts || {}, where); }
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
      '<div class="fm-news-link">' +
      // The publisher's preview image over the drawn cover; if it fails, the cover shows.
      '<div class="fm-news-cover">' + cover(item.topic, i) +
      (item.image ? '<img src="' + esc(item.image) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
      '</div>' +
      '<div class="fm-news-body">' +
      '<div class="fm-news-meta">' + (isNew(item) ? '<span class="fm-news-new">' + esc(tr.newsNew) + '</span>' : '') + (topic ? '<span class="fm-news-topic">' + esc(topic) + '</span>' : '') + '<span>' + meta + '</span></div>' +
      '<h3 class="fm-news-title" tabindex="-1">' + esc(item.title) + '</h3>' +
      (item.summary ? '<p class="fm-news-summary">' + esc(item.summary) + '</p>' : '') + take(item, tr, lang) +
      '</div></div>' + actions(item, tr) + '</article>';
  }

  function cards(items, tr, lang) {
    return (items || []).map(function (it, i) { return card(it, i, tr, lang); }).join('');
  }

  root.FM_NEWS_UI = { cards: cards, layout: layout, filters: filters, stamp: stamp, moreButton: moreButton };
})(typeof window !== 'undefined' ? window : this);
