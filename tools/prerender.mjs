// formai — prerender the page in English and Finnish for search engines.
// Fills every data-i18n element with its text, sets language, title,
// description, canonical and hreflang links, adds FAQ structured data,
// and writes <out>/index.html (en), <out>/fi/index.html (fi) and a sitemap.
// Usage: node tools/prerender.mjs <out-dir> <site-url>
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const out = process.argv[2] || '_site';
let site = process.argv[3] || 'https://jaysssss1111.github.io/Formai/';
site = site.replace(/\/+$/, '') + '/';

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync('assets/js/i18n.js', 'utf8'), ctx);
const { T, LEGAL } = ctx.window.FM_I18N;
const template = fs.readFileSync(path.join(out, 'index.html'), 'utf8');

// News cards are drawn by assets/js/news.js from assets/data/news.json.
vm.runInNewContext(fs.readFileSync('assets/js/news.js', 'utf8'), ctx);
const NEWS = fs.existsSync('assets/data/news.json') ? JSON.parse(fs.readFileSync('assets/data/news.json', 'utf8')) : [];

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const TAG = "font-family: 'DM Mono', ui-monospace, monospace; font-size: 12px; font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase; line-height: 1; padding: 8px 12px; border: 1px solid var(--strong); color: var(--muted);";

function render(lang) {
  const tr = Object.assign({}, T[lang], LEGAL[lang]);
  const url = lang === 'fi' ? site + 'fi/' : site;
  let html = template;

  // Text content of empty data-i18n elements.
  html = html.replace(/(<([a-zA-Z][\w-]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>)(<\/\2>)/g, (m, open, tag, key, close) => {
    const v = get(tr, key);
    return typeof v === 'string' ? open + esc(v) + close : m;
  });
  // aria-label from data-i18n-aria-label.
  html = html.replace(/<([a-zA-Z][\w-]*)\b([^>]*?)\sdata-i18n-aria-label="([^"]+)"([^>]*)>/g, (m, tag, a, key, b) => {
    const v = get(tr, key);
    if (typeof v !== 'string' || /\saria-label=/.test(a + b)) return m;
    return `<${tag}${a} data-i18n-aria-label="${key}" aria-label="${esc(v)}"${b}>`;
  });
  // Tag lists.
  html = html.replace(/(<div\b[^>]*\sdata-list="([^"]+)"[^>]*>)\s*(<\/div>)/g, (m, open, key, close) => {
    const list = get(tr, key);
    return Array.isArray(list) ? open + list.map((t) => `<span style="${TAG}">${esc(t)}</span>`).join('') + close : m;
  });

  // AI news: lead story, list, filters and stamp in the HTML, data inline so the page needs no extra request.
  if (NEWS.length) {
    html = html.replace('<section id="news" class="fm-grain" hidden', '<section id="news" class="fm-grain"');
    const UI = ctx.window.FM_NEWS_UI;
    html = html.replace('<div class="fm-news-grid" id="fm-news-root"></div>', '<div class="fm-news-grid" id="fm-news-root">' + UI.layout(NEWS, tr, lang, {}) + '</div>');
    html = html.replace('<div class="fm-news-filters fm-reveal" id="fm-news-filters" role="group"></div>',
      '<div class="fm-news-filters fm-reveal" id="fm-news-filters" role="group" aria-label="' + esc(tr.newsFilter) + '">' + UI.filters(NEWS, tr, '') + '</div>');
    html = html.replace('<span class="fm-news-stamp" id="fm-news-stamp"></span>', '<span class="fm-news-stamp" id="fm-news-stamp">' + esc(UI.stamp(NEWS, tr, lang)) + '</span>');
  }
  html = html.replace('<script src="assets/js/news.js', '<script>window.FM_NEWS=' + JSON.stringify(NEWS).replace(/</g, '\\u003c') + ';</script>\n<script src="assets/js/news.js');

  // Language, title, description, links.
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}" data-page-lang="${lang}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(tr.meta.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(tr.meta.description)}">`);
  // Every q/a pair, in the order they appear on the page.
  const faqOrder = [...html.matchAll(/data-i18n="faq\.q(\d+)"/g)].map((m) => Number(m[1]));
  const faq = faqOrder.map((n) => ({
    '@type': 'Question', name: tr.faq['q' + n], acceptedAnswer: { '@type': 'Answer', text: tr.faq['a' + n] }
  }));
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', name: 'formai', url: site, description: tr.meta.description },
    { '@type': 'FAQPage', inLanguage: lang, mainEntity: faq }
  ] };
  const head = [
    `<link rel="canonical" href="${url}">`,
    `<link rel="alternate" hreflang="en" href="${site}">`,
    `<link rel="alternate" hreflang="fi" href="${site}fi/">`,
    `<link rel="alternate" hreflang="x-default" href="${site}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="formai">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(tr.meta.title)}">`,
    `<meta property="og:description" content="${esc(tr.meta.description)}">`,
    `<meta property="og:locale" content="${lang === 'fi' ? 'fi_FI' : 'en_GB'}">`,
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
  ].join('\n');
  html = html.replace('</head>', head + '\n</head>');

  // The Finnish page lives one folder down.
  if (lang === 'fi') html = html.replace(/(href|src)="assets\//g, '$1="../assets/');
  return html;
}

const en = render('en');
const fi = render('fi');
fs.writeFileSync(path.join(out, 'index.html'), en);
fs.mkdirSync(path.join(out, 'fi'), { recursive: true });
fs.writeFileSync(path.join(out, 'fi', 'index.html'), fi);

const alt = `<xhtml:link rel="alternate" hreflang="en" href="${site}"/><xhtml:link rel="alternate" hreflang="fi" href="${site}fi/"/>`;
fs.writeFileSync(path.join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  `<url><loc>${site}</loc>${alt}</url>\n<url><loc>${site}fi/</loc>${alt}</url>\n</urlset>\n`);
console.log('prerendered en + fi for', site);
